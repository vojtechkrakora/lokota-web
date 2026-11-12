import { mkdir, writeFile, copyFile, rm, readdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { validateContent } from './check-content.ts';
import { pragueClock } from '../src/lib/dates.ts';

// Explicit synthetic editorial examples live only during this check (or --keep UI review).
const news = resolve('src/content/news/sdd-test');
const editions = resolve('src/content/tournaments/sdd-test');
const downloads = resolve('public/downloads/sdd-test');
// Match the actual Pages CMS collection/media paths without changing the retained draft.
const cmsEntry = resolve('src/content/news/redakce/00000000-0000-4000-8000-000000000040.md');
const cmsImage = resolve('src/content/news/redakce/images/sdd-cms.png');
const cleanup = async () => { for (const path of [news, editions, downloads, cmsEntry, cmsImage]) await rm(path, { recursive: true, force: true }); };
if (process.argv.includes('--clean')) { await cleanup(); process.exit(0); }
for (const path of [news, editions, downloads, cmsEntry, cmsImage]) {
  try { await access(path); throw new Error(`Test area already exists: ${path}. Remove with --clean after reviewing.`); }
  catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
}
try {
  for (const path of [news, editions, downloads]) await mkdir(path, { recursive: true });
  await copyFile('tests/fixtures/test-cover.png', resolve(news, 'test-cover.png'));
  await copyFile('tests/fixtures/draft-only.png', resolve(news, 'draft-only.png'));
  // Current-date entries sort first and exercise both homepage preview variants.
  for (const [slug, cover] of [['000-sdd-home-cover', true], ['001-sdd-home-plain', false]] as const) await writeFile(resolve(news, `${slug}.md`), `---
slug: ${slug}
title: "TEST — náhled úvodní stránky"
publicationDate: "${pragueClock(new Date()).date}"
summary: "Pouze syntetický test náhledu článku."
${cover ? 'cover:\n  src: ./test-cover.png\n  alt: "Testovací geometrická grafika, nejde o fotografii klubu"\n' : ''}---

Pouze testovací obsah.
`);
  for (let i = 1; i <= 12; i++) await writeFile(resolve(news, `${i}.md`), `---
slug: sdd-test-${i}
title: "TEST — článek ${i}"
publicationDate: "2025-10-${String(i).padStart(2, '0')}"
summary: "Pouze testovací obsah pro ověření článků a galerie."
${i === 1 ? 'downloads:\n  - label: TEST — příloha článku\n    path: /downloads/sdd-test/results.csv\n' : ''}${i % 2 ? 'cover:\n  src: ./test-cover.png\n  alt: "Testovací geometrická grafika, nejde o fotografii klubu"\n' : ''}gallery:
  - src: ./test-cover.png
    alt: "Testovací grafika v galerii"
    caption: "TEST — pouze pro kontrolu zpracování obrázků."
---

## Pouze testovací obsah

Tento článek nepopisuje **skutečnou událost**. [Zpět na novinky](/novinky/).\n\n- Testovací odrážka\n- Další bod
`);
  await writeFile(resolve(news, 'draft.md'), `---
slug: sdd-private-draft
title: "PRIVATE_DRAFT_TEST_MARKER"
publicationDate: "2099-01-01"
summary: "Tento text nesmí být veřejný."
draft: true
cover:
  src: ./draft-only.png
  alt: "Soukromá testovací grafika konceptu"
---
PRIVATE_DRAFT_TEST_MARKER
`);
  for (const year of [2001, 2002, 2003]) await writeFile(resolve(editions, `${year}.md`), `---
year: ${year}
name: "TEST — Žižkova 200"
description: "Pouze testovací ročník, nejde o historické údaje klubu."
${year === 2001 ? 'qualifiesForMcr: false' : year === 2002 ? 'qualifiesForMcr: true\nisCurrent: true' : ''}
downloads:
  - label: "TEST — výsledky CSV"
    path: /downloads/sdd-test/results.csv
---

## Pouze testovací obsah

Nejde o skutečné výsledky turnaje.
${year !== 2003 ? '\n## Výsledky\n\n| Dvojice | Kuželky |\n| --- | --- |\n| Testovací dvojice | 123 |\n' : ''}`);
  await writeFile(resolve(downloads, 'results.csv'), 'dvojice,kuzelky\nTestovaci dvojice,123\n');
  await copyFile('tests/fixtures/test-cover.png', cmsImage);
  await writeFile(cmsEntry, `---
slug: 00000000-0000-4000-8000-000000000040
title: TEST — redakční článek
publicationDate: '2024-01-01'
summary: Pouze dočasná zkouška cest editoru.
draft: false
cover:
  src: ./images/sdd-cms.png
  alt: Testovací geometrická grafika
gallery: []
downloads:
  - label: TEST — redakční příloha
    path: /downloads/sdd-test/results.csv
---
## Test redakce

Text s **formátováním** a [odkazem](/novinky/).
`);
  validateContent();
  const result = spawnSync(process.execPath, ['scripts/build.ts', '--fixture'], { stdio: 'inherit', env: { ...process.env, SITE_ORIGIN: 'https://editorial-test.invalid', ASTRO_TELEMETRY_DISABLED: '1' } });
  assert.equal(result.status, 0, 'Editorial static build must succeed');
  const out = '.cache/offline-dist';
  for (const route of ['novinky/sdd-test-1/index.html', 'novinky/archiv/2025/index.html', 'novinky/archiv/2025/strana/2/index.html', 'zizkova-200/2001/index.html', 'zizkova-200/2002/index.html', 'zizkova-200/2003/index.html']) await access(resolve(out, route));
  const cmsHtml = await readFile(resolve(out, 'novinky/00000000-0000-4000-8000-000000000040/index.html'), 'utf8');
  assert.match(cmsHtml, /<strong>formátováním<\/strong>/);
  assert.match(cmsHtml, /alt="Testovací geometrická grafika"/);
  assert.match(cmsHtml, /srcset=/);
  assert.match(cmsHtml, /TEST — redakční příloha/);
  const html = await readFile(resolve(out, 'novinky/sdd-test-1/index.html'), 'utf8');
  assert.match(html, /<strong>skutečnou událost<\/strong>/);
  assert.match(html, /<li>Testovací odrážka<\/li>/);
  assert.match(html, /aria-labelledby="article-downloads"/);
  assert.match(html, /href="\/downloads\/sdd-test\/results.csv" download/);
  assert.match(html, /TEST — příloha článku/);
  await access(resolve(out, 'downloads/sdd-test/results.csv'));
  assert.match(html, /srcset=/); assert.match(html, /loading="lazy"/); assert.match(html, /width="/);
  const noCover = await readFile(resolve(out, 'novinky/sdd-test-2/index.html'), 'utf8');
  assert.ok(!noCover.includes('id="article-downloads"'), 'Articles without downloads do not show an empty section');
  assert.ok(!noCover.includes('class="article-cover"'), 'Optional cover must not produce a broken hero');
  const listing = await readFile(resolve(out, 'novinky/index.html'), 'utf8');
  const homepage = await readFile(resolve(out, 'index.html'), 'utf8');
  const homeSlugs = [...homepage.matchAll(/data-news-slug="([^"]+)"/g)].map(match => match[1]);
  assert.equal(homeSlugs.length, 4, 'Homepage curates four published manual articles');
  assert.deepEqual(homeSlugs.slice(0, 2), ['000-sdd-home-cover', '001-sdd-home-plain'], 'Homepage keeps editorial date/slug ordering');
  assert.match(homepage, /class="story-photo"/);
  assert.match(homepage, /class="story-art-label"/);
  const newsEntries = [...listing.matchAll(/<article\b[^>]*data-feed-kind="news"[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.ok(newsEntries.some(entry => !entry.includes('class="feed-visual"')), 'News without a cover remains readable without an image tile');
  assert.ok(!listing.includes('news-default'), 'Do not repeat large emblem placeholders');
  assert.match(listing, /class="feed-photo"/);
  const files = await readdir(out, { recursive: true });
  // The growing real article collection can move the synthetic result off page 1.
  const feedPages = files.filter(f => f === 'novinky/index.html' || /^novinky\/strana\/\d+\/index\.html$/.test(f));
  assert.ok((await Promise.all(feedPages.map(f => readFile(resolve(out, f), 'utf8')))).some(html => html.includes('class="score-preview-value"')), 'Paginated mixed news retains the official result tile');
  assert.ok(!files.some(f => /sdd-private-draft|draft-only/.test(f)), 'Draft routes and original images must not be emitted');
  for (const file of files.filter(f => /\.(html|xml|json)$/.test(f))) assert.ok(!(await readFile(resolve(out, file), 'utf8')).includes('PRIVATE_DRAFT_TEST_MARKER'), 'Draft text must not be emitted, including in the runtime manifest');
  for (const file of files.filter(f => f.endsWith('.html'))) assert.ok(!/lokot[\p{L}]*/iu.test(await readFile(resolve(out, file), 'utf8')), 'Unused nickname must not be emitted');
  const current = await readFile(resolve(out, 'zizkova-200/index.html'), 'utf8');
  assert.match(current, /Ročník 2002/); assert.match(current, /kvalifikační na MČR/);
  assert.match(await readFile(resolve(out, 'zizkova-200/2001/index.html'), 'utf8'), /není kvalifikační/);
  assert.match(await readFile(resolve(out, 'zizkova-200/2003/index.html'), 'utf8'), /zatím nebyly zveřejněny/);
  console.log('Editorial smoke passed: content-only articles/editions, pagination, optimized gallery, downloads, qualification states, no public drafts.');
} finally { if (!process.argv.includes('--keep')) await cleanup(); }
