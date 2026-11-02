import type { Match } from './sports.ts';
import { site } from '../site.ts';

type Team = Match['homeTeam'];
const accents = { A: 'red', B: 'blue', C: 'green', D: 'purple', E: 'orange' } as const;
type TeamAccent = typeof accents[keyof typeof accents];

export function teamAccent(team: Team): TeamAccent | undefined {
  if (team.club.id !== site.clubId) return undefined;
  const prefix = `${site.clubName} `;
  if (!team.name.startsWith(prefix)) return undefined;
  const suffix = team.name.slice(prefix.length);
  return Object.hasOwn(accents, suffix) ? accents[suffix as keyof typeof accents] : undefined;
}

export function matchAppearance(teams: Team[]) {
  const [first, second] = [...new Set(teams.map(teamAccent).filter(accent => accent !== undefined))];
  return {
    accent: second ? 'mixed' : first,
    style: second ? `--match-first: var(--team-${first}); --match-second: var(--team-${second});` : undefined,
  };
}
