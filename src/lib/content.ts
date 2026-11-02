import { getCollection } from 'astro:content';
import { isPublished, currentEdition } from './content-rules.ts';
import { mergeFeed } from './feed.ts';
import { readSports } from './sports-data.ts';

export async function publicContent() {
  const news = (await getCollection('news')).filter(isPublished).sort((a, b) => b.data.publicationDate.localeCompare(a.data.publicationDate) || a.data.slug.localeCompare(b.data.slug));
  const tournaments = (await getCollection('tournaments')).filter(isPublished).sort((a, b) => b.data.year - a.data.year);
  return { news, tournaments, current: currentEdition(tournaments) };
}
export async function feedContent() {
  const content = await publicContent();
  const sports = readSports();
  return { ...content, sports, feed: mergeFeed(content.news.map(e => ({ key: `news-${e.data.slug}`, kind: 'news' as const, date: e.data.publicationDate, title: e.data.title, summary: e.data.summary, href: `/novinky/${e.data.slug}/` })), sports.matches, sports.fetchedAt) };
}
