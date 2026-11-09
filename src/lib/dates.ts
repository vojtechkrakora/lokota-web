import { site } from '../site.ts';

// Reuse formatters across a whole page/refresh rather than constructing one per cell.
const clockFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: site.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dateFormat = new Intl.DateTimeFormat(site.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const updatedFormat = new Intl.DateTimeFormat(site.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: site.timeZone });
const numericFormat = new Intl.NumberFormat(site.locale, { maximumFractionDigits: 2 });

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function pragueClock(instant: string | Date) {
  const parts = clockFormat.formatToParts(new Date(instant));
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

export const formatDate = (value: string) => dateFormat.format(new Date(`${value}T12:00:00Z`));
export const formatUpdated = (value: string) => updatedFormat.format(new Date(value));
export const number = (value: number | null | undefined) => value == null ? '—' : numericFormat.format(value);
