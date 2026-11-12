import type { TournamentResults } from './tournament-results.ts';

type Edition = { data: { year: number; draft?: boolean; results: TournamentResults }; body?: string };

export function hasTournamentResults(entry: Edition): boolean {
  if (entry.data.results.length > 0) return true;
  // Older authored editions may keep their results in a Markdown section.
  const heading = /^(#{1,6})[ \t]+Výsledky[ \t]*\r?\n/im.exec(entry.body ?? '');
  if (!heading) return false;
  const nextSection = new RegExp(`^#{1,${heading[1]!.length}}[ \\t]+`, 'm');
  const section = entry.body!.slice(heading.index + heading[0].length).split(nextSection)[0];
  return !!section?.trim();
}

export function latestResultsEdition<T extends Edition>(entries: T[]): T | undefined {
  return entries.filter(entry => !entry.data.draft && hasTournamentResults(entry))
    .sort((a, b) => b.data.year - a.data.year)[0];
}

export function tournamentWinners(groups: TournamentResults) {
  return groups.flatMap(group => {
    const categories = group.pairs.filter(pair => pair.category?.position === 1)
      .map(pair => ({ label: pair.category!.label, pair, groupId: group.id }));
    // Category ranks are authoritative where provided; never infer them from totals.
    return categories.length ? categories : group.pairs.filter(pair => pair.position === 1)
      .map(pair => ({ label: group.label, pair, groupId: group.id }));
  });
}
