import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, latestSeason, prepareSports, matchSchema, score, nextMatch, standingsForTeam } from '../src/lib/sports.ts';
import { match, season, home, away, competition, fixtureSports } from './fixtures/sports.ts';
import { mergeFeed, paginate, type FeedItem } from '../src/lib/feed.ts';
import { pragueClock, validDate, formatDate } from '../src/lib/dates.ts';
import { teamAccent, matchAppearance } from '../src/lib/team-colors.ts';
import { site } from '../src/site.ts';

const json = (body: unknown, status = 200, headers?: HeadersInit) => new Response(JSON.stringify(body), { status, headers });
function mock(responses: (unknown | Response | Error)[]) {
  const urls: string[] = [];
  const fetcher: typeof fetch = async input => {
    urls.push(String(input)); const value = responses.shift();
    if (value === undefined) throw new Error('Unexpected request');
    if (value instanceof Error) throw value;
    return value instanceof Response ? value : json(value);
  };
  return { fetcher, urls, api: createApi({ fetch: fetcher, sleep: async () => {} }) };
}
const page = (items: unknown[], total = items.length, offset = 0) => ({ items, total, offset, limit: 100 });

test('each published team has a distinct accent; derbies retain their actual pair of colors', () => {
  const team = (suffix: string) => ({ ...home, id: 9876 + suffix.charCodeAt(0), name: `${site.clubName} ${suffix}` });
  const [a, b, c, d, e] = ['A', 'B', 'C', 'D', 'E'].map(team);
  assert.deepEqual([a!, b!, c!, d!, e!].map(teamAccent), ['red', 'blue', 'green', 'purple', 'orange']);
  assert.equal(teamAccent({ ...a!, club: away.club }), undefined);
  assert.equal(teamAccent(team('F')), undefined);
  assert.equal(teamAccent(team('A extra')), undefined);
  assert.equal(matchAppearance([away, a!]).accent, 'red');
  assert.equal(matchAppearance([b!, away]).accent, 'blue');
  assert.deepEqual(matchAppearance([c!, e!]), { accent: 'mixed', style: '--match-first: var(--team-green); --match-second: var(--team-orange);' });
  assert.deepEqual(matchAppearance([e!, c!]), { accent: 'mixed', style: '--match-first: var(--team-orange); --match-second: var(--team-green);' });
  assert.equal(matchAppearance([away, { ...a!, club: away.club }]).accent, undefined);
  assert.equal(matchAppearance([]).style, undefined);
  const feed = mergeFeed([], [{ ...match, homeTeam: c!, awayTeam: e! }], '2026-11-02T12:00:00Z');
  assert.equal(feed.length, 1);
  assert.equal(matchAppearance(feed[0]!.teams!).accent, 'mixed');
});

test('score tiles preserve home/away order, zeros, fractional points and corrected official values', () => {
  const instant = '2026-11-02T12:00:00Z';
  assert.deepEqual(mergeFeed([], [match], instant)[0]!.result, { home: 8, away: 0 });
  const corrected = { ...match, results: match.results.map(row => ({ ...row, teamPoints: row.isHome ? 0 : 7.5 })) };
  const item = mergeFeed([], [corrected], instant)[0]!;
  assert.deepEqual(item.result, { home: 0, away: 7.5 });
  assert.match(item.summary, /0 : 7,5/);
  assert.equal(item.key, `match-${match.id}`);
  assert.equal(mergeFeed([], [{ ...match, results: [] }], instant).length, 0);
});

test('featured standings follow club/name membership, preserving official rows and empty-table states', () => {
  const sports = fixtureSports();
  const row = sports.competitions[0]!.rows[0]!;
  sports.competitions[0]!.rows = [{ ...row, position: 1, team: away }, row];
  const selected = standingsForTeam(sports, home.name);
  assert.strictEqual(selected[0], sports.competitions[0]);
  assert.deepEqual(selected[0]!.rows.map(r => r.position), [1, 3]);
  assert.equal(selected[0]!.rows[1]!.tablePoints, 5);
  assert.deepEqual(standingsForTeam(sports, 'Unpublished A team'), []);
  // An away fixture still identifies its competition before standings exist.
  sports.matches = [{ ...match, homeTeam: away, awayTeam: home }];
  sports.competitions[0]!.rows = [];
  assert.equal(standingsForTeam(sports, home.name).length, 1);
  // Published standings can identify the team without a fixture.
  sports.matches = [];
  sports.competitions[0]!.rows = [row];
  assert.equal(standingsForTeam(sports, home.name).length, 1);
  sports.competitions[0]!.rows = [{ ...row, team: { ...home, club: away.club } }];
  assert.deepEqual(standingsForTeam(sports, home.name), []);
  sports.competitions = [];
  assert.deepEqual(standingsForTeam(sports, home.name), []);
});

test('API schema validates required includes, enums, dates and sides; strips private extras', () => {
  const parsed = matchSchema.parse({ ...match, refereeName: 'DO NOT KEEP', homeTeam: { ...home, club: { ...home.club, bankNo: 'private' } } });
  assert.ok(!JSON.stringify(parsed).includes('private'));
  assert.ok(!JSON.stringify(parsed).includes('DO NOT KEEP'));
  assert.equal(score(parsed), '8 : 0'); // Array is deliberately away-first.
  assert.equal(score(parsed, 'totalSetPoints'), '13,5 : 10,5');
  for (const change of [{ homeTeam: undefined }, { results: undefined }, { status: 'UNKNOWN' }, { id: '1' }, { date: '2026-02-30' }, { time: '24:00' }, { results: [match.results[0], match.results[0]] }]) assert.equal(matchSchema.safeParse({ ...match, ...change }).success, false);
  const partial = matchSchema.parse({ ...match, date: null, time: null, venue: null, results: [{ isHome: true, teamPoints: null, totalPerformance: null, totalSetPoints: null }] });
  assert.equal(score(partial), '— : —');
  assert.equal(partial.venue, null);
});

test('club match pagination constructs verified filters and reads every page', async () => {
  const { api, urls } = mock([page([match], 2), page([{ ...match, id: 2 }], 2, 1)]);
  assert.equal((await api.matches(1)).length, 2);
  const url = new URL(urls[1]!);
  assert.equal(url.searchParams.get('clubId'), '279');
  assert.equal(url.searchParams.get('seasonId'), '1');
  assert.equal(url.searchParams.get('offset'), '1');
  assert.equal(url.searchParams.get('sort'), 'id');
  assert.equal(url.searchParams.get('include'), 'homeTeam.club,awayTeam.club,competition.season,venue,results');
});

test('inconsistent pagination restarts collection only once and rejects truncation', async () => {
  for (const bad of [page([match], 2, 1), page([], 2, 1), page([{ ...match, id: 2 }], 3, 1), page([{ ...match, id: 2 }], 2, 0)]) {
    const { api, urls } = mock([page([match], 2), bad, page([match], 2), bad]);
    await assert.rejects(api.matches(1), /pagination|ids/);
    assert.equal(urls.length, 4);
  }
  const recover = mock([page([match], 2), page([], 2, 1), page([match])]);
  assert.equal((await recover.api.matches(1)).length, 1);
  const wrong = mock([page([{ ...match, competition: { ...competition, season: { ...season, id: 2 } } }])]);
  await assert.rejects(wrong.api.matches(1), /wrong club\/season/);
  const other = mock([page([{ ...match, homeTeam: away }])]);
  await assert.rejects(other.api.matches(1));
});

test('HTTP retries are bounded; client errors/schema errors are not retried', async () => {
  const good = { items: [season], total: 1 };
  for (const failure of [new Error('network'), json({}, 503), json({}, 429, { 'Retry-After': '999' })]) {
    const first = failure instanceof Response ? failure.clone() : failure;
    const second = failure instanceof Response ? failure.clone() : failure;
    const m = mock([first, second, good]);
    assert.equal((await m.api.seasons()).length, 1); assert.equal(m.urls.length, 3);
  }
  const exhausted = mock([new Error(), new Error(), new Error(), good]);
  await assert.rejects(exhausted.api.seasons(), /network\/timeout/); assert.equal(exhausted.urls.length, 3);
  for (const response of [json({}, 400), json({}, 401), json({}, 403), json({}, 404), json({ items: [{ ...season, id: 'bad' }], total: 1 }), new Response('not json')]) {
    const m = mock([response, good]); await assert.rejects(m.api.seasons()); assert.equal(m.urls.length, 1);
  }
});

test('timeouts and preparation aborts cannot produce successful data', async () => {
  let calls = 0;
  const hanging: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    calls++;
    init!.signal!.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
  });
  // Keep a referenced handle: AbortSignal.timeout timers intentionally do not keep Node alive.
  const timer = setInterval(() => {}, 50);
  try {
    await assert.rejects(createApi({ fetch: hanging, sleep: async () => {}, timeoutMs: 5 }).seasons(), /network\/timeout/);
    assert.equal(calls, 3);
    await assert.rejects(prepareSports({ fetch: hanging, signal: AbortSignal.abort() }));
  } finally { clearInterval(timer); }
});

test('latest season uses chronological start, including future/empty and ambiguous dates', () => {
  const newer = { ...season, id: 2, name: 'Not parsed as a year', active: false, q3StartDate: '2027-09-01', q1StartDate: '2028-03-01' };
  assert.equal(latestSeason([newer, { ...season, id: 999 }]).id, 2);
  assert.throws(() => latestSeason([]), /No published/);
  assert.throws(() => latestSeason([season, { ...season, id: 2 }]), /Ambiguous/);
});

test('dataset discovers multiple club teams once, unions table teams, preserves official ranks', async () => {
  const row = fixtureSports().competitions[0]!.rows[0]!;
  const derby = { ...match, awayTeam: { ...home, id: 3, name: 'Testovací Tábor B' } };
  const m = mock([{ items: [season], total: 1 }, page([derby]), [1, 22, 4], { items: [row, { ...row, position: 7, team: { ...home, id: 4 } }], total: 2 }]);
  const data = await prepareSports({ fetch: m.fetcher, now: () => new Date('2026-11-02T12:00:00Z') });
  assert.deepEqual(data.teams.map(t => t.id), [1, 3, 4]);
  assert.equal(data.matches.length, 1); assert.equal(data.competitions[0]?.round, 22);
  assert.equal(data.competitions[0]?.rows[1]?.position, 7);
  assert.equal(data.competitions[0]?.rows[0]?.teamPointsWon, 20.5);
  assert.match(m.urls[3]!, /rounds\/22\/table\?type=ALL/);
});

test('empty latest season and valid empty official tables are supported; failed requests are fatal', async () => {
  const empty = mock([{ items: [season], total: 1 }, page([])]);
  const data = await prepareSports({ fetch: empty.fetcher });
  assert.equal(data.matches.length, 0); assert.equal(data.teams.length, 0); assert.equal(empty.urls.length, 2);
  for (const rounds of [[], [1]]) {
    const m = mock([rounds, { items: [], total: 0 }]);
    assert.equal((await m.api.table(competition)).rows.length, 0);
    assert.equal(m.urls.length, rounds.length ? 2 : 1);
  }
  await assert.rejects(mock([{ items: [1] }]).api.table(competition), /schema/);
  await assert.rejects(mock([[1], json({}, 404)]).api.table(competition), /404/);
  await assert.rejects(mock([[1], { items: [], total: 2 }]).api.table(competition), /Incomplete/);
});

const news: FeedItem = { key: 'news-test', kind: 'news', date: '2026-10-30', title: 'Test', summary: 'Test', href: '/novinky/test/' };
test('mixed feed is stable, manual-first on date ties, deduplicates derby and uses match ids for corrections', () => {
  const instant = '2026-11-02T12:00:00Z';
  const feed = mergeFeed([news, { ...news, key: 'news-later', date: '2026-11-01' }], [match, match], instant);
  assert.deepEqual(feed.map(f => f.key), ['news-later', 'news-test', 'match-1']);
  assert.deepEqual(mergeFeed([news], [match], instant), mergeFeed([news], [match], '2026-11-03T12:00:00Z'));
  const corrected = mergeFeed([], [{ ...match, results: match.results.map(r => ({ ...r, teamPoints: 4 })) }], instant);
  assert.equal(corrected[0]?.key, 'match-1'); assert.match(corrected[0]!.summary, /4 : 4/);
  assert.equal(mergeFeed([], [{ ...match, status: 'SCHEDULED' }], instant).length, 0);
  assert.match(mergeFeed([], [{ ...match, status: 'FORFEIT' }], instant)[0]!.summary, /Kontumace/);
  for (const partial of [{ date: null }, { date: '2026-12-01' }, { results: [] }, { results: match.results.map(r => ({ ...r, teamPoints: null })) }]) assert.equal(mergeFeed([], [{ ...match, ...partial }], instant).length, 0);
  assert.deepEqual(paginate(Array.from({ length: 21 }, (_, i) => i)).map(p => p.items.length), [10, 10, 1]);
});

test('Prague clock handles midnight and DST while date/time labels preserve supplied calendar day', () => {
  assert.deepEqual(pragueClock('2026-10-31T23:30:00Z'), { date: '2026-11-01', time: '00:30' });
  assert.deepEqual(pragueClock('2026-03-29T00:30:00Z'), { date: '2026-03-29', time: '01:30' });
  assert.deepEqual(pragueClock('2026-03-29T01:30:00Z'), { date: '2026-03-29', time: '03:30' });
  assert.match(formatDate('2026-03-29'), /29/);
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2026-02-29'), false);
  const schedule = { ...match, status: 'SCHEDULED' as const, date: '2026-11-02', time: null, results: [] };
  assert.equal(nextMatch([schedule], '2026-11-02T12:00:00Z')?.id, 1);
  assert.equal(nextMatch([{ ...schedule, time: '09:00' }], '2026-11-02T12:00:00Z'), undefined);
  assert.equal(nextMatch([{ ...schedule, date: '2026-11-01' }], '2026-11-02T12:00:00Z'), undefined);
  assert.equal(nextMatch([{ ...schedule, status: 'IN_PROGRESS' }], '2026-11-02T12:00:00Z'), undefined);
});
