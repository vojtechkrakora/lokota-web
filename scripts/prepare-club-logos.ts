import { mkdir, rm, writeFile } from 'node:fs/promises';
import { imageMetadata } from 'astro/assets/utils';
import imageService from 'astro/assets/services/sharp';
import { clubLogoUrl } from '../src/lib/logo-source.ts';
import { site } from '../src/site.ts';
import type { Sports } from '../src/lib/sports.ts';

const maxBytes = 2 * 1024 * 1024;
const maxPixels = 16_000_000;
export const clubLogosDirectory = new URL('../.cache/club-logos/', import.meta.url);

export async function prepareClubLogos(sports: Sports, options: {
  directory?: URL; fetch?: typeof fetch; warn?: (message: string) => void; timeoutMs?: number;
} = {}) {
  const directory = options.directory ?? clubLogosDirectory;
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  if (sports.provenance === 'fixture') return 0;
  const request = options.fetch ?? fetch;
  const warn = options.warn ?? console.warn;
  const clubs = new Map(sports.matches.flatMap(match => [match.homeTeam.club, match.awayTeam.club])
    .filter(club => club.id !== site.clubId).map(club => [club.id, club]));
  const queue = [...clubs.values()];
  let saved = 0;
  async function worker() {
    for (let club = queue.shift(); club; club = queue.shift()) {
      const url = clubLogoUrl(club.logo);
      if (url) {
        let reason = 'network/timeout';
        try {
          const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 5000), headers: { Accept: 'image/*' } });
          reason = 'HTTP or unsupported response';
          if (!response.ok || !response.headers.get('content-type')?.startsWith('image/') || Number(response.headers.get('content-length')) > maxBytes) {
            await response.body?.cancel();
            throw new Error(reason);
          }
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
          const output = await imageService.transform(input, { src: url.href, width: 96, height: 96, format: 'webp', fit: 'contain', quality: 90 },
            { service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: maxPixels } }, dangerouslyProcessSVG: true,
              endpoint: { route: '/_image' }, domains: [], remotePatterns: [], responsiveStyles: false }, console);
          const checked = await imageMetadata(output.data);
          if (checked.format !== 'webp' || checked.width > 96 || checked.height > 96) throw new Error(reason);
          await writeFile(new URL(`${club.id}.webp`, directory), output.data);
          saved++;
        } catch { warn(`Club logo unavailable: club ${club.id} (${reason}); using placeholder.`); }
      } else if (club.logo) warn(`Club logo unavailable: club ${club.id} (invalid source); using placeholder.`);
    }
  }
  await Promise.all([worker(), worker()]);
  return saved;
}
