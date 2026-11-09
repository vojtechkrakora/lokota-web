import test from 'node:test';
import assert from 'node:assert/strict';
import { createSportsRefresh, manifestSchema } from '../src/lib/sports-refresh.ts';
import { createApi, type Sports } from '../src/lib/sports.ts';
import { renderSports, renderFeed, renderMatch, renderTables, type SportsManifest } from '../src/lib/sports-html.ts';
import { fixtureSports, match } from './fixtures/sports.ts';
import { site } from '../src/site.ts';

const instant = '2026-11-09T12:00:00Z';
const manifest: SportsManifest = { version: 'a'.repeat(20), builtAt: '2026-11-02T12:00:00Z', provenance: 'live', logos: {}, covers: {}, news: [], staticNewsPages: 1 };
const request = new Request('https://club.example/api/sports');
const current = (): Sports => ({ ...fixtureSports(), provenance: 'live', fetchedAt: instant });
class MemoryCache {
  data = new Map<string, Response>();
  async match(request: Request) { return this.data.get(request.url)?.clone(); }
  async put(request: Request, response: Response) { this.data.set(request.url, response.clone()); }
}

test('refresh caches one complete success for five minutes without browser caching; query strings do not bypass it', async () => {
  const cache = new MemoryCache(); const refresh = createSportsRefresh(); let calls = 0;
  const options = { cache, manifest, now: () => new Date(instant), prepare: async () => { calls++; return current(); } };
  const first = await refresh(request, options);
  assert.equal(first.status, 200); assert.equal(first.headers.get('X-Sports-Cache'), 'MISS');
  assert.equal(first.headers.get('Cache-Control'), 'no-store');
  const body = await first.json(); assert.equal(body.fetchedAt, instant); assert.equal(body.version, manifest.version);
  assert.ok(body.slots.matches.includes('zapas-1')); assert.ok(body.slots.tables.includes('Testovací soutěž'));
  const second = await refresh(new Request(`${request.url}?cache-bust=1`), options);
  assert.equal(second.headers.get('X-Sports-Cache'), 'HIT'); assert.deepEqual(await second.json(), body); assert.equal(calls, 1);
  const stored = [...cache.data.values()][0]!; assert.equal(stored.headers.get('Cache-Control'), 'public, max-age=300');
  await refresh(request, { ...options, now: () => new Date(Date.parse(instant) + 299_000) }); assert.equal(calls, 1);
  await refresh(request, { ...options, now: () => new Date(Date.parse(instant) + 300_000) }); assert.equal(calls, 2);
});

test('simultaneous cold visitors share preparation; deployments and origins remain isolated', async () => {
  const cache = new MemoryCache(); const refresh = createSportsRefresh(); let calls = 0;
  const options = { cache, manifest, now: () => new Date(instant), prepare: async () => { calls++; await new Promise(r => setTimeout(r, 5)); return current(); } };
  const responses = await Promise.all([refresh(request, options), refresh(request, options)]);
  assert.equal(calls, 1); assert.deepEqual(await responses[0]!.json(), await responses[1]!.json());
  await refresh(request, { ...options, manifest: { ...manifest, version: 'b'.repeat(20) } });
  await refresh(new Request('https://preview.example/api/sports'), options); assert.equal(calls, 3);
});

test('upstream failure, invalid/partial data and fixture provenance never replace cached good results', async () => {
  const cache = new MemoryCache(); const refresh = createSportsRefresh();
  await refresh(request, { cache, manifest, now: () => new Date(instant), prepare: async () => current() });
  const stored = JSON.stringify(await [...cache.data.values()][0]!.clone().json());
  const invalid = [() => { throw new Error('private transport diagnostics'); }, () => ({ ...current(), competitions: undefined }), () => ({ ...current(), provenance: 'fixture' }), () => ({ ...current(), matches: [{ ...match, results: undefined }] }), () => ({ ...current(), fetchedAt: '2020-01-01T00:00:00Z' })];
  for (const prepare of invalid) {
    const response = await refresh(request, { cache, manifest, now: () => new Date(Date.parse(instant) + 301_000), prepare: prepare as never });
    assert.equal(response.status, 503); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.ok(!(await response.text()).includes('private'));
    assert.equal(JSON.stringify(await [...cache.data.values()][0]!.clone().json()), stored);
  }
  const recovered = await refresh(request, { cache, manifest, now: () => new Date(Date.parse(instant) + 302_000), prepare: async () => ({ ...current(), fetchedAt: '2026-11-09T12:05:02Z' }) });
  assert.equal(recovered.status, 200); assert.equal((await recovered.json()).fetchedAt, '2026-11-09T12:05:02Z');
});

test('valid empty sports data publish honest empty states; cache failures do not discard fresh results', async () => {
  const cache = { match: async () => { throw Error(); }, put: async () => { throw Error(); } };
  const response = await createSportsRefresh()(request, { cache, manifest, now: () => new Date(instant), prepare: async () => ({ ...current(), matches: [], competitions: [], teams: [] }) });
  assert.equal(response.status, 200);
  const body = await response.json(); assert.ok(body.slots['home-matches'].includes('Další zápas zatím není naplánován'));
  assert.ok(body.slots.tables.includes('Tabulky se zobrazí')); assert.equal(body.newsPages.length, 1);
});

test('runtime request budget includes retries; methods other than GET never prepare', async () => {
  let calls = 0;
  const api = createApi({ maxRequests: 2, sleep: async () => {}, fetch: async () => { calls++; return new Response(null, { status: 503 }); } });
  await assert.rejects(api.seasons(), /budget exceeded/); assert.equal(calls, 2);
  const response = await createSportsRefresh()(new Request(request.url, { method: 'POST' }), { cache: new MemoryCache(), manifest, prepare: async () => { throw Error('Should not prepare'); } });
  assert.equal(response.status, 405); assert.equal(response.headers.get('Allow'), 'GET');
});

test('public API rejects redirects with Workers-compatible manual mode, without following another host', async () => {
  let calls = 0;
  const api = createApi({ fetch: async (_url, init) => {
    calls++; assert.equal(init?.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://other.example/' } });
  } });
  await assert.rejects(api.seasons(), /HTTP 302/); assert.equal(calls, 1);
});

test('runtime passes a deadline, timeouts and bounded request count into the verified API client', async () => {
  const response = await createSportsRefresh()(request, { cache: new MemoryCache(), manifest, now: () => new Date(instant), prepare: async options => {
    assert.ok(options?.signal instanceof AbortSignal); assert.equal(options?.maxRequests, 40); assert.equal(options?.timeoutMs, 4000);
    throw new DOMException('timeout', 'TimeoutError');
  } });
  assert.equal(response.status, 503);
});

test('newly finished and corrected matches update homepage and generated news together; current clock excludes past fixtures', () => {
  const sports = current();
  sports.matches = [{ ...match, id: 99, status: 'SCHEDULED', date: '2026-11-09', time: '12:00', results: [] }, { ...match, id: 100, status: 'SCHEDULED', date: '2026-11-10', results: [] }];
  const before = renderSports(sports, manifest, instant);
  assert.ok(!before.slots['home-matches'].includes('data-match-id="99"')); assert.ok(before.slots['home-matches'].includes('data-match-id="100"'));
  sports.matches[0] = { ...sports.matches[0]!, status: 'FINISHED', results: match.results.map(r => ({ ...r, teamPoints: r.isHome ? 0 : 7.5 })) };
  const after = renderSports(sports, manifest, instant);
  assert.ok(after.slots['home-matches'].includes('data-match-id="99"')); assert.ok(after.newsPages[0]!.includes('0 : 7,5'));
  assert.ok(after.slots.matches.includes('0 : 7,5'));
  sports.matches[0] = { ...sports.matches[0]!, status: 'IN_PROGRESS' };
  assert.ok(!renderSports(sports, manifest, instant).newsPages.join('').includes('data-feed-key="match-99"'));
});

test('all runtime pages preserve manual-first ties and use existing routes or query fallback for new pages', () => {
  const sports = current(); sports.matches = Array.from({ length: 21 }, (_, i) => ({ ...match, id: 100 + i, date: '2026-11-09' }));
  const news = [{ key: 'news-test', kind: 'news' as const, date: '2026-11-09', title: 'Ruční článek', summary: 'Text', href: '/novinky/test/' }];
  const result = renderSports(sports, { ...manifest, news }, instant);
  assert.equal(result.newsPages.length, 3); assert.ok(result.newsPages[0]!.indexOf('news-test') < result.newsPages[0]!.indexOf('match-100'));
  assert.ok(result.newsPages[0]!.includes('/novinky/?strana=2'));
  assert.ok(renderSports(sports, { ...manifest, news, staticNewsPages: 3 }, instant).newsPages[0]!.includes('/novinky/strana/2/'));
});

test('shared renderers escape untrusted names/venues and preserve official positions, side order and fractional/absent scores', () => {
  const evil = '<img src=x onerror="alert(1)">';
  const sports = current(); sports.matches = [{ ...match, homeTeam: { ...match.homeTeam, name: evil }, venue: { name: evil } }];
  const html = renderMatch(sports.matches[0]!, manifest);
  assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img')); assert.ok(html.includes('8 : 0'));
  assert.ok(renderMatch({ ...match, results: [] }, manifest).includes('— : —'));
  const row = sports.competitions[0]!.rows[0]!; sports.competitions[0]!.rows = [{ ...row, position: 7, tablePoints: 0.5, team: { ...row.team, name: `${site.clubName} A` } }];
  assert.ok(renderTables(sports, true).includes('7.</td>')); assert.ok(renderTables(sports).includes('0,5'));
  assert.ok(!renderFeed([{ key: 'news-x', kind: 'news', title: evil, summary: evil, href: '/novinky/x/', date: '2026-11-09' }], manifest).includes('<img src=x'));
});

test('build manifest excludes fixtures, external asset sources, drafts and unsafe editorial URLs', () => {
  assert.ok(manifestSchema.safeParse(manifest).success);
  for (const change of [{ provenance: 'fixture' }, { logos: { '279': 'https://external.test/logo.png' } }, { covers: { x: { src: 'javascript:alert(1)', width: 10, height: 10 } } }, { news: [{ key: 'x', kind: 'news', date: '2026-11-09', title: 'x', summary: 'x', href: 'javascript:alert(1)' }] }]) assert.equal(manifestSchema.safeParse({ ...manifest, ...change }).success, false);
});
