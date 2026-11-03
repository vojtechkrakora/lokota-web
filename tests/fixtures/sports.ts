import { datasetSchema, type Match, type Season, type Sports } from '../../src/lib/sports.ts';

export const season: Season = { id: 1, name: 'Testovací sezóna', active: true, q3StartDate: '2026-09-01', q1StartDate: '2027-03-01' };
export const home = { id: 1, name: 'Testovací Tábor A', club: { id: 279, name: 'Testovací klub' } };
export const away = { id: 2, name: 'Testovací soupeř', club: { id: 999, name: 'Testovací soupeř' } };
export const competition = { id: 1, name: 'Testovací soutěž', slug: 'testovaci-soutez', season };
export const match: Match = { id: 1, date: '2026-10-30', time: '10:00', round: 1, status: 'FINISHED', homeTeam: home, awayTeam: away, competition, venue: { name: 'Testovací herna' }, results: [
  { isHome: false, teamPoints: 0, totalPerformance: 3000, totalSetPoints: 10.5 },
  { isHome: true, teamPoints: 8, totalPerformance: 3100, totalSetPoints: 13.5 },
] };
export function fixtureSports(): Sports {
  // Existing editorial links also need destinations in offline output. These IDs
  // retain the links; names, dates and tables remain explicitly synthetic fixtures.
  const linkedCompetitions = [16, 63, 68].map(id => ({ ...competition, id, slug: `testovaci-soutez-${id}` }));
  const linkedMatches = [[5881, 68], [5882, 68], [5870, 68], [5458, 63], [531, 16]].map(([id, competitionId]) => ({
    ...match, id, competition: linkedCompetitions.find(c => c.id === competitionId)!, status: 'SCHEDULED', date: '2026-11-07', results: [],
  }));
  return datasetSchema.parse({ schemaVersion: 1, provenance: 'fixture', clubId: 279, fetchedAt: '2026-11-02T12:00:00Z', season, teams: [home], matches: [match, { ...match, id: 2, status: 'SCHEDULED', date: '2026-11-07', results: [] }, ...linkedMatches], competitions: [{ competition, round: 22, rows: [{ type: 'ALL', position: 3, matches: 4, wins: 2, draws: 1, losses: 1, tablePoints: 5, teamPointsWon: 20.5, teamPointsLost: 11.5, team: home }] }, ...linkedCompetitions.map(competition => ({ competition, round: 1, rows: [] }))] });
}
