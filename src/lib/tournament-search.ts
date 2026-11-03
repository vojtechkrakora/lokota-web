export function normalizeTournamentSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('cs').trim().replace(/\s+/g, ' ');
}

export function matchesTournamentPlayers(players: readonly string[], query: string): boolean {
  const tokens = normalizeTournamentSearch(query).split(' ').filter(Boolean);
  return tokens.length === 0 || players.some(player => {
    const text = normalizeTournamentSearch(player);
    return tokens.every(token => text.includes(token));
  });
}
