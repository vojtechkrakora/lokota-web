import { z } from 'astro/zod';
import { ApiError, calendarDate, datasetSchema, prepareSports } from './sports.ts';
import { renderSports, type SportsManifest } from './sports-html.ts';

export const refreshSeconds = 300;
const localAsset = z.string().regex(/^\/_astro\/[a-zA-Z0-9_.-]+$/);
export const manifestSchema = z.object({
  version: z.string().regex(/^[a-f0-9]{20}$/), builtAt: z.iso.datetime(), provenance: z.literal('live'),
  logos: z.record(z.string().regex(/^\d+$/), localAsset),
  covers: z.record(z.string(), z.object({ src: localAsset, width: z.number().int().positive(), height: z.number().int().positive() })),
  staticNewsPages: z.number().int().positive(),
  news: z.array(z.object({ key: z.string(), kind: z.literal('news'), date: calendarDate, title: z.string(), summary: z.string(), href: z.string().regex(/^\/novinky\/[a-z0-9-]+\/$/) })),
});

type ResponseCache = { match(request: Request): Promise<Response | undefined>; put(request: Request, response: Response): Promise<unknown> };
type Options = { cache: ResponseCache; manifest: SportsManifest; prepare?: typeof prepareSports; now?: () => Date; warn?: (message: string) => void };

// One in-flight refresh per deployment/origin within this isolate, not a global lock.
export function createSportsRefresh() {
  const pending = new Map<string, Promise<Response>>();
  return async (request: Request, options: Options) => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } });
    const { manifest, cache } = options;
    const now = options.now ?? (() => new Date());
    const key = new Request(new URL(`/api/sports?version=${manifest.version}`, request.url));
    let cached: Response | undefined;
    try { cached = await cache.match(key); } catch { options.warn?.('Sports cache read unavailable'); }
    const savedAt = cached?.headers.get('X-Sports-Fetched-At');
    const age = savedAt ? now().valueOf() - Date.parse(savedAt) : Infinity;
    if (cached?.ok && age >= 0 && age < refreshSeconds * 1000) return outgoing(cached, 'HIT');

    const id = key.url;
    let work = pending.get(id);
    if (!work) {
      work = (async () => {
        try {
          const signal = AbortSignal.timeout(12_000);
          const sports = datasetSchema.parse(await (options.prepare ?? prepareSports)({ signal, timeoutMs: 4000, maxRequests: 40, now }));
          signal.throwIfAborted();
          if (sports.provenance !== 'live' || Date.parse(sports.fetchedAt) < Date.parse(manifest.builtAt)) throw new Error('Invalid refresh provenance/time');
          const body = renderSports(sports, manifest, now().toISOString());
          const response = Response.json(body, { headers: { 'Cache-Control': `public, max-age=${refreshSeconds}`, 'X-Sports-Fetched-At': sports.fetchedAt, 'X-Content-Type-Options': 'nosniff' } });
          try { await cache.put(key, response.clone()); } catch { options.warn?.('Sports cache write unavailable'); }
          return response;
        } catch (error) {
          const detail = error instanceof ApiError ? error.message : error instanceof z.ZodError ? 'dataset validation' : error instanceof DOMException ? error.name : 'runtime processing';
          options.warn?.(`Sports refresh failed (${detail}); published HTML remains available`);
          return Response.json({ error: 'Sportovní data se nyní nepodařilo obnovit.' }, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
        }
      })();
      pending.set(id, work);
      void work.finally(() => pending.delete(id));
    }
    return outgoing((await work).clone(), 'MISS');
  };
}

function outgoing(response: Response, status: string) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Sports-Cache', status);
  return new Response(response.body, { status: response.status, headers });
}
