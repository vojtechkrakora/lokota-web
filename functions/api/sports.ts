import { createSportsRefresh, manifestSchema } from '../../src/lib/sports-refresh.ts';

type Context = { request: Request; env: { ASSETS: { fetch(request: Request): Promise<Response> } } };
const refresh = createSportsRefresh();

export async function onRequest(context: Context) {
  if (context.request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } });
  try {
    const response = await context.env.ASSETS.fetch(new Request(new URL('/sports-manifest.json', context.request.url)));
    if (!response.ok) throw new Error('Missing sports manifest');
    const manifest = manifestSchema.parse(await response.json());
    // CacheStorage.default is provided by the Pages/Workers runtime.
    const cache = (caches as unknown as { default: Cache }).default;
    return await refresh(context.request, { cache, manifest, warn: message => console.warn(message) });
  } catch {
    console.warn('Sports endpoint unavailable; published HTML remains available');
    return Response.json({ error: 'Sportovní data se nyní nepodařilo obnovit.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
