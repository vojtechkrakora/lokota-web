export const site = {
  name: 'Lokomotiva Tábor', clubName: 'KK Lokomotiva Tábor', clubId: 279,
  apiBase: 'https://kuzelky.cz/api/v1/public', locale: 'cs-CZ', timeZone: 'Europe/Prague',
} as const;

export const navigation = [
  ['Novinky', '/novinky/'], ['Zápasy', '/zapasy/'], ['Tabulky', '/tabulky/'],
  ['Žižkova 200', '/zizkova-200/'], ['Klub', '/klub/'],
] as const;

export function publishingContext(env: Record<string, string | undefined>) {
  const provider = env.CF_PAGES_URL;
  const candidate = env.CF_PAGES_BRANCH === 'main' ? env.SITE_ORIGIN || provider : provider || env.SITE_ORIGIN;
  let origin: string | undefined;
  if (candidate) {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password || /^(localhost|127\.|\[::1\])/.test(url.hostname)) {
      throw new Error('SITE_ORIGIN/CF_PAGES_URL must be a public HTTPS origin without a path.');
    }
    origin = url.origin;
  }
  if (env.CF_PAGES && !origin) throw new Error('Pages build requires a verified public origin.');
  // Indexing remains off until the explicitly authorized launch phase.
  return { origin, noindex: true };
}
