// Build-only Astro image preparation. Runtime rendering receives local URLs only.
import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { clubEmblem } from './club-logos.ts';
import type { Sports } from './sports.ts';
import type { SportsAssets } from './sports-html.ts';

const images = new Map<string, Promise<string>>();
export async function sportsAssets(sports: Sports, news: CollectionEntry<'news'>[] = []): Promise<SportsAssets> {
  const logos: SportsAssets['logos'] = {};
  const covers: SportsAssets['covers'] = {};
  const clubs = new Set(sports.matches.flatMap(m => [m.homeTeam.club.id, m.awayTeam.club.id]));
  for (const clubId of clubs) {
    const image = clubEmblem(clubId);
    if (!image) continue;
    const key = `${image.src}:112`;
    if (!images.has(key)) images.set(key, getImage({ src: image, width: 112, height: 112, fit: 'contain', format: 'webp' }).then(image => image.src));
    logos[clubId] = await images.get(key)!;
  }
  for (const entry of news) {
    if (!entry.data.cover) continue;
    const image = await getImage({ src: entry.data.cover.src, width: Math.min(600, entry.data.cover.src.width), format: 'webp' });
    covers[`news-${entry.data.slug}`] = { src: image.src, width: Number(image.attributes.width), height: Number(image.attributes.height) };
  }
  return { logos, covers };
}
