import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { imageMetadata } from 'astro/assets/utils';
import { prepareClubLogos, saveClubLogoSnapshots } from '../scripts/prepare-club-logos.ts';
import { clubLogoUrl } from '../src/lib/logo-source.ts';
import { matchSchema, type Sports } from '../src/lib/sports.ts';
import { fixtureSports, match } from './fixtures/sports.ts';

const source = 'https://evidence.kuzelky.cz/assets/clubs/logo klubu.png';
const picture = await readFile(new URL('./fixtures/test-cover.png', import.meta.url));
const imageResponse = () => new Response(new Uint8Array(picture), { headers: { 'content-type': 'image/png' } });
const logoSports = (ids = [999]): Sports => ({ ...fixtureSports(), provenance: 'live' as const, matches: ids.map((id, i) => ({
  ...match, id: i + 1, homeTeam: { ...match.homeTeam, club: { ...match.homeTeam.club, logo: source } },
  awayTeam: { ...match.awayTeam, club: { ...match.awayTeam.club, id, logo: source } },
})) });
async function temporary(run: (directory: URL) => Promise<void>) {
  const path = await mkdtemp(`${tmpdir()}/club-logos-`);
  try { await run(pathToFileURL(`${path}/`)); }
  finally { await rm(path, { recursive: true, force: true }); }
}

test('logo references permit only the verified official HTTPS image location', () => {
  assert.equal(clubLogoUrl(source)?.href, source.replace(' ', '%20'));
  for (const input of [undefined, null, 12, '', 'bad URL', '/assets/clubs/logo.png',
    'http://evidence.kuzelky.cz/assets/clubs/logo.png', 'https://other.test/assets/clubs/logo.png',
    'https://evidence.kuzelky.cz:444/assets/clubs/logo.png', 'https://user:secret@evidence.kuzelky.cz/assets/clubs/logo.png',
    'https://evidence.kuzelky.cz/assets/clubs/../private.png', `${source}?token=secret`, `${source}#part`]) {
    assert.equal(clubLogoUrl(input), undefined);
  }
});

test('optional logo fields tolerate missing or malformed artwork without weakening club identity', () => {
  assert.equal(matchSchema.parse(match).homeTeam.club.logo, undefined);
  for (const logo of [source, null, 123]) {
    const parsed = matchSchema.parse({ ...match, homeTeam: { ...match.homeTeam, club: { ...match.homeTeam.club, logo, bankNo: 'private' } } });
    assert.equal(parsed.homeTeam.club.logo, typeof logo === 'number' ? null : logo);
    assert.equal('bankNo' in parsed.homeTeam.club, false);
  }
  assert.throws(() => matchSchema.parse({ ...match, homeTeam: { ...match.homeTeam, club: { logo: source } } }));
});

test('logo preparation deduplicates clubs, bounds concurrency and emits small local raster images', async () => {
  await temporary(async directory => {
    let active = 0; let maximum = 0; let requests = 0;
    const request: typeof fetch = async (_url, options) => {
      assert.equal(options?.redirect, 'error');
      assert.ok(options?.signal);
      requests++; active++; maximum = Math.max(active, maximum);
      await new Promise(resolve => setTimeout(resolve, 5)); active--;
      return imageResponse();
    };
    const saved = await prepareClubLogos(logoSports([999, 999, 1000, 1001]), { directory, fetch: request });
    assert.equal(saved, 3); assert.equal(requests, 3); assert.equal(maximum, 2);
    assert.deepEqual((await readdir(directory)).sort(), ['1000.webp', '1001.webp', '999.webp']);
    const image = await imageMetadata(await readFile(new URL('999.webp', directory)));
    assert.equal(image.format, 'webp'); assert.ok(image.width <= 96 && image.height <= 96);
  });
});

test('SVG club artwork becomes raster output rather than embedded SVG', async () => {
  await temporary(async directory => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60"><rect width="40" height="60" fill="red"/></svg>';
    assert.equal(await prepareClubLogos(logoSports(), { directory, fetch: async () => new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }) }), 1);
    const image = await imageMetadata(await readFile(new URL('999.webp', directory)));
    assert.equal(image.format, 'webp'); assert.equal(image.width / image.height, 2 / 3);
  });
});

test('absent/invalid sources and offline fixtures clear old artwork without network requests', async () => {
  await temporary(async directory => {
    await writeFile(new URL('999.webp', directory), picture);
    const request: typeof fetch = async () => { assert.fail('Unexpected network request'); };
    assert.equal(await prepareClubLogos({ ...logoSports(), provenance: 'fixture' }, { directory, fetch: request }), 0);
    assert.deepEqual(await readdir(directory), []);
    const sports = logoSports([999, 1000]);
    delete sports.matches[0]!.awayTeam.club.logo;
    sports.matches[1]!.awayTeam.club.logo = 'https://other.test/logo.png';
    const warnings: string[] = [];
    assert.equal(await prepareClubLogos(sports, { directory, fetch: request, warn: message => warnings.push(message) }), 0);
    assert.equal(warnings.length, 1); assert.match(warnings[0]!, /club 1000/);
  });
});

test('HTTP failures, redirects, malformed images and size limits fall back without failing sports preparation', async () => {
  const cases = [
    () => new Response('', { status: 404 }),
    () => new Response('', { status: 302, headers: { location: 'https://other.test/logo.png' } }),
    () => new Response('not an image', { headers: { 'content-type': 'text/html' } }),
    () => new Response('corrupt', { headers: { 'content-type': 'image/png' } }),
    () => new Response('', { headers: { 'content-type': 'image/png', 'content-length': String(2 * 1024 * 1024 + 1) } }),
    () => new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { 'content-type': 'image/png' } }),
    () => new Response('<svg xmlns="http://www.w3.org/2000/svg" width="5000" height="5000"/>', { headers: { 'content-type': 'image/svg+xml' } }),
    () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('Partial response')); } }), { headers: { 'content-type': 'image/png' } }),
  ];
  await temporary(async directory => {
    for (const response of cases) {
      const warnings: string[] = [];
      assert.equal(await prepareClubLogos(logoSports(), { directory, fetch: async () => response(), warn: message => warnings.push(message) }), 0);
      assert.equal(warnings.length, 1); assert.deepEqual(await readdir(directory), []);
    }
  });
});

test('optional logo requests time out and leave no stale output', async () => {
  await temporary(async directory => {
    const request: typeof fetch = async (_url, options) => new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout signal was not used')), 1000);
      options!.signal!.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Aborted')); }, { once: true });
    });
    const warnings: string[] = [];
    assert.equal(await prepareClubLogos(logoSports(), { directory, fetch: request, timeoutMs: 5, warn: message => warnings.push(message) }), 0);
    assert.match(warnings[0]!, /network\/timeout/);
    assert.deepEqual(await readdir(directory), []);
  });
});

test('build diagnostics distinguish absent sources, HTTP failures and safe network codes without leaking upstream details', async () => {
  await temporary(async directory => {
    const warnings: string[] = []; const summaries: string[] = [];
    const sports = logoSports([999, 1000]);
    delete sports.matches[1]!.awayTeam.club.logo;
    const options = { directory, warn: (message: string) => warnings.push(message), info: (message: string) => summaries.push(message) };
    assert.equal(await prepareClubLogos(sports, { ...options, fetch: async () => new Response('private upstream body', { status: 403 }) }), 0);
    assert.deepEqual(summaries, ['Club logo sources: 2 opponent clubs, 1 allowed references.']);
    assert.deepEqual(warnings, ['Club logo unavailable: club 999 (HTTP 403); using placeholder.']);
    warnings.length = 0;
    const cause = Object.assign(new Error('https://user:secret@example.test/private'), { code: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' });
    const request: typeof fetch = async () => { throw new TypeError('private request details', { cause }); };
    assert.equal(await prepareClubLogos(sports, { ...options, fetch: request }), 0);
    assert.deepEqual(warnings, ['Club logo unavailable: club 999 (network/timeout; UNABLE_TO_GET_ISSUER_CERT_LOCALLY); using placeholder.']);
    warnings.length = 0;
    cause.code = 'PRIVATE_UNKNOWN_CODE';
    await prepareClubLogos(sports, { ...options, fetch: request });
    assert.deepEqual(warnings, ['Club logo unavailable: club 999 (network/timeout; TypeError); using placeholder.']);
  });
});

test('matching snapshots survive rejected downloads while fresh images take precedence and builds leave snapshots unchanged', async () => {
  await temporary(async root => {
    const directory = new URL('prepared/', root); const snapshotDirectory = new URL('snapshots/', root);
    const sports = logoSports();
    await prepareClubLogos(sports, { directory, snapshotDirectory, fetch: async () => imageResponse() });
    assert.equal(await saveClubLogoSnapshots(sports, { directory: snapshotDirectory, preparedDirectory: directory }), 1);
    const stored = await readFile(new URL('999.webp', snapshotDirectory));
    const index = await readFile(new URL('sources.json', snapshotDirectory), 'utf8');
    assert.deepEqual(JSON.parse(index), { '999': clubLogoUrl(source)!.href });
    const failures: typeof fetch[] = [
      async () => new Response('Denied', { status: 403 }),
      async () => new Response('Upstream page', { headers: { 'content-type': 'text/html' } }),
      async () => { throw new TypeError('Network unavailable'); },
      async () => new Response('Broken image', { headers: { 'content-type': 'image/png' } }),
    ];
    for (const fetch of failures) {
      const warnings: string[] = [];
      assert.equal(await prepareClubLogos(sports, { directory, snapshotDirectory, fetch, warn: message => warnings.push(message) }), 1);
      assert.deepEqual(await readFile(new URL('999.webp', directory)), stored);
      assert.match(warnings[0]!, /using stored snapshot/);
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>';
    assert.equal(await prepareClubLogos(sports, { directory, snapshotDirectory,
      fetch: async () => new Response(svg, { headers: { 'content-type': 'image/svg+xml' } }), warn: () => assert.fail('Fresh image failed') }), 1);
    assert.notDeepEqual(await readFile(new URL('999.webp', directory)), stored);
    assert.deepEqual(await readFile(new URL('999.webp', snapshotDirectory)), stored);
    assert.equal(await readFile(new URL('sources.json', snapshotDirectory), 'utf8'), index);
    assert.equal(await prepareClubLogos({ ...sports, provenance: 'fixture' }, { directory, snapshotDirectory,
      fetch: async () => assert.fail('Fixture requested a logo') }), 0);
    assert.deepEqual(await readdir(directory), []);
  });
});

test('changed sources, different clubs and malformed or missing snapshots retain neutral placeholders', async () => {
  await temporary(async root => {
    const directory = new URL('prepared/', root); const snapshotDirectory = new URL('snapshots/', root);
    const sports = logoSports();
    await prepareClubLogos(sports, { directory, snapshotDirectory, fetch: async () => imageResponse() });
    await saveClubLogoSnapshots(sports, { directory: snapshotDirectory, preparedDirectory: directory });
    const index = await readFile(new URL('sources.json', snapshotDirectory), 'utf8');
    const unavailable: typeof fetch = async () => new Response('', { status: 403 });
    const check = async (data = sports) => {
      assert.equal(await prepareClubLogos(data, { directory, snapshotDirectory, fetch: unavailable, warn: () => {} }), 0);
      assert.deepEqual(await readdir(directory), []);
    };
    const changed = logoSports(); changed.matches[0]!.awayTeam.club.logo = source.replace('.png', '-new.png');
    await check(changed);
    await check(logoSports([1000]));
    await writeFile(new URL('sources.json', snapshotDirectory), '{broken');
    await check();
    await writeFile(new URL('sources.json', snapshotDirectory), index);
    for (const invalid of [Buffer.from('corrupt'), picture, Buffer.alloc(2 * 1024 * 1024 + 1)]) {
      await writeFile(new URL('999.webp', snapshotDirectory), invalid);
      await check();
    }
    await rm(new URL('999.webp', snapshotDirectory));
    await check();
  });
});

test('snapshot refresh validates every prepared image and refuses fixtures before changing tracked sources', async () => {
  await temporary(async root => {
    const preparedDirectory = new URL('prepared/', root); const directory = new URL('snapshots/', root);
    await mkdir(directory);
    await writeFile(new URL('sources.json', directory), '{}\n');
    await prepareClubLogos(logoSports(), { directory: preparedDirectory, snapshotDirectory: directory, fetch: async () => imageResponse() });
    await assert.rejects(saveClubLogoSnapshots(logoSports([999, 1000]), { directory, preparedDirectory }));
    assert.deepEqual(await readdir(directory), ['sources.json']);
    await assert.rejects(saveClubLogoSnapshots(fixtureSports(), { directory, preparedDirectory }), /live sports data/);
    assert.equal(await readFile(new URL('sources.json', directory), 'utf8'), '{}\n');
  });
});

test('repository snapshot index references only valid small official opponent emblems', async () => {
  const directory = new URL('../src/assets/opponent-logos/', import.meta.url);
  const sources: Record<string, string> = JSON.parse(await readFile(new URL('sources.json', directory), 'utf8'));
  assert.ok(Object.keys(sources).length > 0);
  for (const [id, source] of Object.entries(sources)) {
    assert.match(id, /^[1-9]\d*$/);
    assert.notEqual(id, '279');
    assert.equal(clubLogoUrl(source)?.href, source);
    const bytes = await readFile(new URL(`${id}.webp`, directory));
    assert.ok(bytes.length <= 2 * 1024 * 1024);
    const image = await imageMetadata(bytes);
    assert.equal(image.format, 'webp');
    assert.ok(image.width > 0 && image.width <= 96 && image.height > 0 && image.height <= 96);
  }
});
