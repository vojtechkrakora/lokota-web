import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { imageMetadata } from 'astro/assets/utils';
import imageService from 'astro/assets/services/sharp';
import { z } from 'astro/zod';
import { clubLogoUrl } from '../src/lib/logo-source.ts';
import { site } from '../src/site.ts';
import type { Sports } from '../src/lib/sports.ts';

const maxBytes = 2 * 1024 * 1024;
const maxPixels = 16_000_000;
export const clubLogosDirectory = new URL('../.cache/club-logos/', import.meta.url);
const snapshotDirectory = new URL('../src/assets/opponent-logos/', import.meta.url);
const sourceIndex = z.record(z.string(), z.string());

function opponentClubs(sports: Sports) {
  return new Map(sports.matches.flatMap(match => [match.homeTeam.club, match.awayTeam.club])
    .filter(club => club.id !== site.clubId).map(club => [club.id, club]));
}

async function checkedSnapshot(file: URL) {
  if ((await stat(file)).size > maxBytes) throw new Error('Snapshot exceeds byte limit');
  const input = await readFile(file);
  const metadata = await imageMetadata(input);
  if (metadata.format !== 'webp' || metadata.width < 1 || metadata.height < 1 || metadata.width > 96 || metadata.height > 96) throw new Error('Invalid logo snapshot');
  return input;
}

// Explicit maintenance only: ordinary builds never write to tracked assets.
export async function saveClubLogoSnapshots(sports: Sports, options: { directory?: URL; preparedDirectory?: URL } = {}) {
  if (sports.provenance !== 'live') throw new Error('Logo snapshots require live sports data');
  const directory = options.directory ?? snapshotDirectory;
  const entries = await Promise.all([...opponentClubs(sports).values()].flatMap(club => {
    const url = clubLogoUrl(club.logo);
    return url ? [(async () => ({ id: club.id, source: url.href,
      data: await checkedSnapshot(new URL(`${club.id}.webp`, options.preparedDirectory ?? clubLogosDirectory)) }))()] : [];
  }));
  // Read/validate every required input before changing the previous snapshot.
  await mkdir(directory, { recursive: true });
  for (const entry of entries) await writeFile(new URL(`${entry.id}.webp`, directory), entry.data);
  await writeFile(new URL('sources.json', directory), `${JSON.stringify(Object.fromEntries(entries.sort((a, b) => a.id - b.id).map(entry => [entry.id, entry.source])), null, 2)}\n`);
  return entries.length;
}

// Keep useful transport diagnostics without logging URLs, arbitrary messages or bodies.
const networkCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
  'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN']);
function errorCode(error: unknown): string {
  if (!(error instanceof Error)) return '';
  for (const value of [error, error.cause]) {
    if (value && typeof value === 'object' && 'code' in value && typeof value.code === 'string' && networkCodes.has(value.code)) return `; ${value.code}`;
  }
  return ['TypeError', 'TimeoutError', 'AbortError', 'RangeError'].includes(error.name) ? `; ${error.name}` : '';
}

export async function prepareClubLogos(sports: Sports, options: {
  directory?: URL; snapshotDirectory?: URL; fetch?: typeof fetch; warn?: (message: string) => void; info?: (message: string) => void; timeoutMs?: number;
} = {}) {
  const directory = options.directory ?? clubLogosDirectory;
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  if (sports.provenance === 'fixture') return 0;
  const request = options.fetch ?? fetch;
  const warn = options.warn ?? console.warn;
  const snapshots = options.snapshotDirectory ?? snapshotDirectory;
  let sources: Record<string, string> = {};
  try { sources = sourceIndex.parse(JSON.parse(await readFile(new URL('sources.json', snapshots), 'utf8'))); }
  catch { /* Missing/corrupt snapshots cannot replace a successful fresh download. */ }
  const clubs = opponentClubs(sports);
  const queue = [...clubs.values()];
  (options.info ?? console.info)(`Club logo sources: ${queue.length} opponent clubs, ${queue.filter(club => clubLogoUrl(club.logo)).length} allowed references.`);
  let saved = 0;
  async function worker() {
    for (let club = queue.shift(); club; club = queue.shift()) {
      const url = clubLogoUrl(club.logo);
      if (url) {
        let reason = 'network/timeout';
        try {
          const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 5000), headers: { Accept: 'image/*' } });
          reason = !response.ok ? `HTTP ${response.status}`
            : !response.headers.get('content-type')?.startsWith('image/') ? 'unsupported content type' : 'declared image exceeds byte limit';
          if (!response.ok || !response.headers.get('content-type')?.startsWith('image/') || Number(response.headers.get('content-length')) > maxBytes) {
            await response.body?.cancel();
            throw new Error(reason);
          }
          reason = 'missing response body';
          if (!response.body) throw new Error(reason);
          reason = 'oversized or incomplete image';
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = []; let bytes = 0;
          try {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              bytes += value.byteLength;
              if (bytes > maxBytes) throw new Error(reason);
              chunks.push(value);
            }
          } finally { await reader.cancel().catch(() => {}); }
          reason = 'invalid image';
          const input = Buffer.concat(chunks);
          const metadata = await imageMetadata(input);
          if (!['jpeg', 'jpg', 'png', 'webp', 'svg'].includes(metadata.format) || metadata.width * metadata.height > maxPixels) throw new Error(reason);
          // Reuse Astro's existing service; SVG sources become inert local raster files.
          reason = 'image transformation failed';
          const output = await imageService.transform(input, { src: url.href, width: 96, height: 96, format: 'webp', fit: 'contain', quality: 90 },
            { service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: maxPixels } }, dangerouslyProcessSVG: true,
              endpoint: { route: '/_image' }, domains: [], remotePatterns: [], responsiveStyles: false }, console);
          reason = 'invalid transformed image';
          const checked = await imageMetadata(output.data);
          if (checked.format !== 'webp' || checked.width > 96 || checked.height > 96) throw new Error(reason);
          reason = 'writing prepared image failed';
          await writeFile(new URL(`${club.id}.webp`, directory), output.data);
          saved++;
        } catch (error) {
          let fallback = 'placeholder';
          if (sources[String(club.id)] === url.href) {
            try {
              const image = await checkedSnapshot(new URL(`${club.id}.webp`, snapshots));
              await writeFile(new URL(`${club.id}.webp`, directory), image);
              saved++;
              fallback = 'stored snapshot';
            } catch { /* Invalid stored images stay unavailable. */ }
          }
          warn(`Club logo unavailable: club ${club.id} (${reason}${errorCode(error)}); using ${fallback}.`);
        }
      } else if (club.logo) warn(`Club logo unavailable: club ${club.id} (invalid source); using placeholder.`);
    }
  }
  await Promise.all([worker(), worker()]);
  return saved;
}
