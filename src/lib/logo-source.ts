import { site } from '../site.ts';

// Only fetch logo locations actually provided by the verified public API.
export function clubLogoUrl(value: unknown): URL | undefined {
  if (typeof value !== 'string' || !value.trim()) return;
  try {
    const url = new URL(value);
    if (url.origin !== site.clubLogoOrigin || !url.pathname.startsWith(site.clubLogoPath)
      || url.username || url.password || url.search || url.hash) return;
    return url;
  } catch { return; }
}
