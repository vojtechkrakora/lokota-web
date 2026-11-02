import type { Match } from './sports.ts';
import { score } from './sports.ts';
import { pragueClock } from './dates.ts';

export type FeedItem = { key: string; kind: 'news' | 'match'; date: string; title: string; summary: string; href: string; teams?: Match['homeTeam'][]; result?: { home: number; away: number } };
export function mergeFeed(news: FeedItem[], matches: Match[], instant: string): FeedItem[] {
  const today = pragueClock(instant).date;
  const seen = new Set<number>();
  const generated: FeedItem[] = [];
  for (const match of matches) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    const home = match.results.find(r => r.isHome)?.teamPoints;
    const away = match.results.find(r => !r.isHome)?.teamPoints;
    if (!['FINISHED', 'FORFEIT'].includes(match.status) || !match.date || match.date > today || home == null || away == null) continue;
    generated.push({ key: `match-${match.id}`, kind: 'match', date: match.date,
      teams: [match.homeTeam, match.awayTeam],
      result: { home, away },
      title: `${match.homeTeam.name} — ${match.awayTeam.name}`, href: `/zapasy/#zapas-${match.id}`,
      summary: `${match.competition.name} · ${score(match)} na body${match.status === 'FORFEIT' ? ' · Kontumace' : ''}. Oficiální výsledek ČKA.` });
  }
  return [...news, ...generated].sort((a, b) => b.date.localeCompare(a.date) || (a.kind === b.kind ? a.key.localeCompare(b.key) : a.kind === 'news' ? -1 : 1));
}
export function paginate<T>(items: T[], size = 10) {
  return Array.from({ length: Math.max(1, Math.ceil(items.length / size)) }, (_, i) => ({ number: i + 1, items: items.slice(i * size, (i + 1) * size), total: Math.max(1, Math.ceil(items.length / size)) }));
}
