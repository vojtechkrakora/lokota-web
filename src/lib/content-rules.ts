import { z } from 'astro/zod';
import { calendarDate } from './sports.ts';
import { pragueClock } from './dates.ts';

const text = z.string().trim().min(1);
const alt = z.string().trim().min(3, 'Describe the image meaningfully');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine(v => !['strana', 'archiv'].includes(v), 'Reserved route');
export function contentSchemas<T extends z.ZodType>(image: T, today = pragueClock(new Date()).date) {
  const picture = z.object({ src: image, alt, caption: text.optional() }).strict();
  return {
    news: z.object({ slug, title: text, publicationDate: calendarDate, summary: text, author: text.optional(), cover: picture.optional(), gallery: z.array(picture).default([]), draft: z.boolean().default(false) }).strict()
      .refine(d => d.draft || d.publicationDate <= today, { message: 'Published articles cannot have future dates', path: ['publicationDate'] }),
    tournaments: z.object({ year: z.number().int().min(1900).max(9999), name: text.default('Žižkova 200'), description: text,
      startDate: calendarDate.optional(), endDate: calendarDate.optional(), isCurrent: z.boolean().default(false), draft: z.boolean().default(false), qualifiesForMcr: z.boolean().optional(),
      gallery: z.array(picture).default([]), downloads: z.array(z.object({ label: text, path: z.string().regex(/^\/downloads\/[a-zA-Z0-9_/-]+\.(pdf|csv)$/) }).strict()).default([]),
    }).strict().refine(d => !d.endDate || !!d.startDate && d.startDate <= d.endDate, { message: 'Date range requires startDate <= endDate', path: ['endDate'] }),
    club: z.object({ page: z.enum(['klub', 'historie', 'kontakt', 'herna']), title: text, summary: text, gallery: z.array(picture).default([]) }).strict(),
  };
}

export const isPublished = <T extends { data: { draft?: boolean } }>(entry: T) => !entry.data.draft;
export function currentEdition<T extends { data: { year: number; isCurrent: boolean; draft?: boolean } }>(editions: T[]) {
  const published = editions.filter(isPublished);
  const marked = published.filter(e => e.data.isCurrent);
  if (marked.length > 1) throw new Error('Only one published tournament edition may be current');
  return marked[0] ?? published.sort((a, b) => b.data.year - a.data.year)[0];
}
export function uniqueValues(values: (string | number)[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}
