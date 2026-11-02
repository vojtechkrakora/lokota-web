import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishingContext } from '../src/site.ts';
import { validateContent } from './check-content.ts';

export async function checkOutput(directory: string, provenance: 'live' | 'fixture') {
  const root = resolve(directory);
  const files = readdirSync(root, { recursive: true, withFileTypes: true }).filter(f => f.isFile()).map(f => resolve(f.parentPath, f.name));
  if (files.length > 20_000) throw new Error('Pages output exceeds 20,000 files');
  for (const file of files) if (statSync(file).size > 25 * 1024 * 1024) throw new Error(`Pages asset exceeds 25 MiB: ${relative(root, file)}`);
  const html = new Map(files.filter(f => extname(f) === '.html').map(f => [f, readFileSync(f, 'utf8')]));
  const ids = new Map<string, Set<string>>();
  for (const [file, body] of html) {
    const values = [...body.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]!);
    if (new Set(values).size !== values.length) throw new Error(`Duplicate HTML id: ${relative(root, file)}`);
    ids.set(file, new Set(values));
  }
  const origin = publishingContext(process.env).origin;
  const publicBase = origin ?? 'https://local-check.invalid';
  const routeFile = (path: string) => resolve(root, `.${decodeURIComponent(path.endsWith('/') ? `${path}index.html` : path)}`);
  const assertLink = (source: string, href: string) => {
    if (!href || /^(mailto:|tel:)/i.test(href)) return;
    if (/^(data:)/i.test(href)) return;
    const sourceRoute = `/${relative(root, source).replace(/index\.html$/, '')}`;
    const url = new URL(href.replaceAll('&amp;', '&'), new URL(sourceRoute, publicBase));
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`Unsupported link protocol in ${sourceRoute}`);
    if (url.origin !== publicBase) return;
    const file = routeFile(url.pathname);
    if (!file.startsWith(`${root}/`) || !existsSync(file) || !statSync(file).isFile()) throw new Error(`Broken local reference in ${sourceRoute}: ${href}`);
    if (url.hash && html.has(file) && !ids.get(file)!.has(decodeURIComponent(url.hash.slice(1)))) throw new Error(`Missing anchor in ${sourceRoute}: ${href}`);
  };
  for (const route of ['/', '/novinky/', '/zapasy/', '/tabulky/', '/zizkova-200/', '/zizkova-200/archiv/', '/klub/', '/historie/', '/kontakt/', '/herna/', '/404.html']) {
    if (!html.has(routeFile(route))) throw new Error(`Required route missing: ${route}`);
  }
  for (const [file, body] of html) {
    if (!body.includes(`data-sports-provenance="${provenance}"`)) throw new Error('Sports provenance mismatch in output');
    if (!body.includes('<html lang="cs"') || !/<title>[^<]+<\/title>/.test(body) || !/name="description" content="[^"]+"/.test(body) || !body.includes('name="robots" content="noindex, nofollow"')) throw new Error(`Missing Czech metadata/noindex: ${relative(root, file)}`);
    const canonical = body.match(/rel="canonical" href="([^"]+)"/)?.[1];
    if (origin && !file.endsWith('/404.html') ? !canonical || !canonical.startsWith(`${origin}/`) : !!canonical) throw new Error('Canonical origin does not match build context');
    for (const m of body.matchAll(/\b(?:href|src)="([^"]+)"/g)) assertLink(file, m[1]!);
    for (const m of body.matchAll(/\bsrcset="([^"]+)"/g)) for (const part of m[1]!.split(',')) assertLink(file, part.trim().split(/\s+/)[0]!);
  }
  const content = validateContent();
  for (const entry of content.news.filter(e => e.data.draft)) if (existsSync(routeFile(`/novinky/${entry.data.slug}/`))) throw new Error(`Draft article published: ${entry.data.slug}`);
  for (const entry of content.tournaments.filter(e => e.data.draft)) if (existsSync(routeFile(`/zizkova-200/${entry.data.year}/`))) throw new Error(`Draft edition published: ${entry.data.year}`);
  const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
  for (const entry of content.news.filter(e => e.data.draft)) if (sitemap.includes(`/novinky/${entry.data.slug}/`)) throw new Error('Draft in sitemap');
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) assertLink(resolve(root, 'index.html'), match[1]!);
  if (!origin && /<loc>/.test(sitemap)) throw new Error('Local sitemap must not invent an origin');
  if (provenance === 'live' && [...html.values()].some(body => body.includes('TESTOVACÍ SPORTOVNÍ DATA'))) throw new Error('Fixture data in release output');
  console.log(`Output valid (${provenance}): ${html.size} HTML pages, ${files.length} files; local links, anchors, assets, metadata and drafts checked.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await checkOutput(process.argv[2] ?? 'dist', 'live');
