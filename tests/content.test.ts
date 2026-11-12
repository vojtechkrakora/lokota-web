import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, truncateSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentSchemas, currentEdition, uniqueValues, isPublished } from '../src/lib/content-rules.ts';
import { localReference, validateContent } from '../scripts/check-content.ts';
import { publishingContext } from '../src/site.ts';

const schemas = contentSchemas(z.string(), '2026-11-02');
const article = { slug: 'test', title: 'Test article', publicationDate: '2026-10-30', summary: 'Test summary', cover: { src: './test.png', alt: 'Testovací grafika' } };
test('content validates calendar dates, future drafts, stable/reserved slugs and meaningful alts', () => {
  const parsed = schemas.news.parse(article);
  assert.equal(parsed.draft, false); assert.deepEqual(parsed.gallery, []);
  assert.equal(schemas.news.parse({ ...article, cover: undefined }).cover, undefined);
  for (const cover of [null, {}, { src: "./test.png" }, { alt: "Popis bez souboru" }]) assert.equal(schemas.news.safeParse({ ...article, cover }).success, false);
  for (const change of [{ slug: 'archiv' }, { slug: 'strana' }, { slug: 'článek' }, { publicationDate: '2026-02-30' }, { publicationDate: '2027-01-01' }, { cover: { src: './test.png', alt: ' ' } }, { unknownField: true }]) assert.equal(schemas.news.safeParse({ ...article, ...change }).success, false);
  assert.equal(schemas.news.parse({ ...article, publicationDate: '2027-01-01', draft: true }).draft, true);
  assert.throws(() => uniqueValues(['same', 'same'], 'slug'), /Duplicate/);
  assert.equal([{ data: parsed }, { data: { ...parsed, draft: true } }].filter(isPublished).length, 1);
});
test('tournament selection, years, date ranges, qualifier tri-state and download paths', () => {
  const edition = schemas.tournaments.parse({ year: 2026, description: 'Test edition' });
  assert.equal(edition.name, 'Žižkova 200'); assert.equal(edition.qualifiesForMcr, undefined);
  assert.equal(currentEdition([{ data: edition }, { data: { ...edition, year: 2025, isCurrent: true } }])?.data.year, 2025);
  assert.equal(currentEdition([{ data: edition }, { data: { ...edition, year: 2027, draft: true } }])?.data.year, 2026);
  assert.equal(currentEdition([]), undefined);
  assert.throws(() => currentEdition([{ data: { ...edition, isCurrent: true } }, { data: { ...edition, year: 2025, isCurrent: true } }]), /Only one/);
  for (const change of [{ startDate: '2026-11-02', endDate: '2026-11-01' }, { endDate: '2026-11-02' }, { downloads: [{ label: 'Escape', path: '/downloads/../secret.pdf' }] }, { year: '2026' }]) assert.equal(schemas.tournaments.safeParse({ ...edition, ...change }).success, false);
  for (const qualifiesForMcr of [true, false]) assert.equal(schemas.tournaments.parse({ ...edition, qualifiesForMcr }).qualifiesForMcr, qualifiesForMcr);
});
test('local references reject missing, escaping and oversized attachments', () => {
  const root = mkdtempSync(join(tmpdir(), 'lokota-references-'));
  try {
    mkdirSync(join(root, 'downloads')); writeFileSync(join(root, 'downloads/results.csv'), 'test'); writeFileSync(join(root, 'secret.pdf'), 'secret');
    assert.ok(localReference(root, 'downloads/results.csv', join(root, 'downloads')));
    assert.throws(() => localReference(root, 'secret.pdf', join(root, 'downloads')), /escapes/);
    assert.throws(() => localReference(root, 'downloads/missing.pdf', join(root, 'downloads')));
    assert.throws(() => localReference(root, 'downloads/results.csv', join(root, 'downloads'), 1), /exceeds/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('news downloads use checked local PDF/CSV references, including drafts', () => {
  assert.deepEqual(schemas.news.parse(article).downloads, []);
  const valid = { label: 'Výsledky (PDF)', path: '/downloads/news/results.pdf' };
  assert.deepEqual(schemas.news.parse({ ...article, downloads: [valid] }).downloads, [valid]);
  for (const change of [
    { path: 'https://example.cz/results.pdf' }, { path: '/downloads/../secret.pdf' },
    { path: '/downloads/news/results.exe' }, { path: '/downloads/news/white space.pdf' },
    { label: ' ' }, { path: '/downloads/news/results.pdf', unknown: true },
  ]) assert.equal(schemas.news.safeParse({ ...article, downloads: [{ ...valid, ...change }] }).success, false);

  const root = mkdtempSync(join(tmpdir(), 'lokota-news-downloads-'));
  const content = join(root, 'content');
  const publicRoot = join(root, 'public');
  try {
    for (const collection of ['news', 'tournaments', 'club']) mkdirSync(join(content, collection), { recursive: true });
    mkdirSync(join(publicRoot, 'downloads/news'), { recursive: true });
    const attachment = join(publicRoot, 'downloads/news/results.pdf');
    const save = (path: string) => writeFileSync(join(content, 'news/test.md'), `---
slug: attachment-test
title: Test attachment
publicationDate: '2025-01-01'
summary: Test summary
draft: true
downloads:
  - label: Results PDF
    path: ${path}
---
Test body.
`);
    save('/downloads/news/results.pdf');
    assert.throws(() => validateContent(content, publicRoot), /Invalid content/, 'A draft must reject missing files too');
    writeFileSync(attachment, '%PDF-1.4\n');
    assert.equal(validateContent(content, publicRoot).news[0].data.downloads.length, 1);
    truncateSync(attachment, 25 * 1024 * 1024 + 1);
    assert.throws(() => validateContent(content, publicRoot), /Invalid content/, 'Oversized news files must fail');
    save('/downloads/../secret.pdf');
    assert.throws(() => validateContent(content, publicRoot), /Invalid content/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('origin policy handles local, PR previews and temporary Pages production without indexing', () => {
  assert.deepEqual(publishingContext({}), { origin: undefined, noindex: true });
  assert.deepEqual(publishingContext({ CF_PAGES: '1', CF_PAGES_URL: 'https://pr.example.pages.dev', SITE_ORIGIN: 'https://example.cz' }), { origin: 'https://pr.example.pages.dev', noindex: true });
  assert.equal(publishingContext({ CF_PAGES_URL: 'https://lokota-test.pages.dev' }).noindex, true);
  assert.equal(publishingContext({ CF_PAGES_BRANCH: 'main', CF_PAGES_URL: 'https://hash.lokota-test.pages.dev', SITE_ORIGIN: 'https://lokota-test.pages.dev' }).origin, 'https://lokota-test.pages.dev');
  for (const value of ['http://example.cz', 'https://localhost', 'https://example.cz/path', 'https://user:secret@example.cz']) assert.throws(() => publishingContext({ SITE_ORIGIN: value }));
  assert.throws(() => publishingContext({ CF_PAGES: '1' }));
});
