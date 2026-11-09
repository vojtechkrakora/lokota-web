// Build-only catalogue, shared by the HTML version marker and static JSON asset.
import { createHash } from 'node:crypto';
import { feedContent } from './content.ts';
import { sportsAssets } from './sports-assets.ts';
import { paginate } from './feed.ts';
import type { SportsManifest } from './sports-html.ts';

let prepared: Promise<SportsManifest> | undefined;
export function sportsManifest() {
  return prepared ??= (async () => {
    const { sports, news, feed } = await feedContent();
    const content = {
      ...await sportsAssets(sports, news), builtAt: sports.fetchedAt, provenance: sports.provenance,
      staticNewsPages: paginate(feed).length,
      news: news.map(e => ({ key: `news-${e.data.slug}`, kind: 'news' as const, date: e.data.publicationDate, title: e.data.title, summary: e.data.summary, href: `/novinky/${e.data.slug}/` })),
    };
    const version = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 20);
    return { ...content, version };
  })();
}
