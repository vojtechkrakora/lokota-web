import type { APIRoute } from 'astro';
import { feedContent } from '../lib/content.ts';
import { paginate } from '../lib/feed.ts';
import { publishingContext } from '../site.ts';

export const GET: APIRoute = async () => {
  const { origin } = publishingContext(process.env);
  const { news, tournaments, feed } = await feedContent();
  const routes = ['/', '/novinky/', '/zapasy/', '/tabulky/', '/zizkova-200/', '/zizkova-200/archiv/', '/klub/', '/historie/', '/kontakt/', '/herna/',
    ...paginate(feed).slice(1).map(p => `/novinky/strana/${p.number}/`),
    ...news.map(n => `/novinky/${n.data.slug}/`), ...tournaments.map(t => `/zizkova-200/${t.data.year}/`),
    ...[...new Set(news.map(n => n.data.publicationDate.slice(0, 4)))].flatMap(y => paginate(news.filter(n => n.data.publicationDate.startsWith(y))).map(p => `/novinky/archiv/${y}/${p.number === 1 ? '' : `strana/${p.number}/`}`)),
  ];
  const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin ? routes.map(r => `<url><loc>${escape(new URL(r, origin).href)}</loc></url>`).join('') : ''}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
