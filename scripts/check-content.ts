import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { z } from 'astro/zod';
import { contentSchemas, currentEdition, uniqueValues } from '../src/lib/content-rules.ts';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function localReference(base: string, value: string, allowed: string, maxBytes = Infinity) {
  const file = resolve(base, value);
  const boundary = realpathSync(allowed);
  const actual = realpathSync(file);
  const inside = relative(boundary, actual);
  if (inside.startsWith(`..${sep}`) || inside === '..' || resolve(boundary, inside) !== actual || !statSync(actual).isFile()) throw new Error(`Reference escapes allowed directory: ${value}`);
  if (statSync(actual).size > maxBytes) throw new Error(`File exceeds 25 MiB: ${value}`);
  return actual;
}

export function validateContent(contentRoot = resolve(root, 'src/content'), publicRoot = resolve(root, 'public')) {
  const schemas = contentSchemas(z.string().min(1));
  const records = { news: [] as { data: z.infer<typeof schemas.news>; body: string }[], tournaments: [] as { data: z.infer<typeof schemas.tournaments>; body: string }[], club: [] as { data: z.infer<typeof schemas.club>; body: string }[] };
  for (const collection of ['news', 'tournaments', 'club'] as const) {
    const directory = resolve(contentRoot, collection);
    const files = readdirSync(directory, { recursive: true, withFileTypes: true }).filter(e => e.isFile() && e.name.endsWith('.md'));
    for (const item of files) {
      const file = resolve(item.parentPath, item.name);
      try {
        const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
        const data = schemas[collection].parse(parsed.frontmatter);
        if (!parsed.content.trim()) throw new Error('Markdown body is required');
        for (const picture of [...('cover' in data && data.cover ? [data.cover] : []), ...data.gallery]) localReference(dirname(file), picture.src, resolve(root, 'src'));
        if ('downloads' in data) for (const download of data.downloads) localReference(publicRoot, download.path.slice(1), resolve(publicRoot, 'downloads'), 25 * 1024 * 1024);
        // Validate draft attachments as well; drafts do not make public/ private.
        if (collection === 'news') records.news.push({ data: schemas.news.parse(parsed.frontmatter), body: parsed.content });
        if (collection === 'tournaments') records.tournaments.push({ data: schemas.tournaments.parse(parsed.frontmatter), body: parsed.content });
        if (collection === 'club') records.club.push({ data: schemas.club.parse(parsed.frontmatter), body: parsed.content });
      } catch (cause) { throw new Error(`Invalid content: ${relative(root, file)}`, { cause }); }
    }
  }
  uniqueValues(records.news.map(e => e.data.slug), 'news slug');
  uniqueValues(records.tournaments.map(e => e.data.year), 'tournament year');
  uniqueValues(records.club.map(e => e.data.page), 'club page');
  currentEdition(records.tournaments);
  return records;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = validateContent();
  console.log(`Content valid: ${data.news.length} articles, ${data.tournaments.length} editions, ${data.club.length} club pages (drafts included in validation).`);
}
