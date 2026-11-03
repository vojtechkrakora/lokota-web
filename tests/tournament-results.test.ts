import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { tournamentResults } from '../src/lib/tournament-results.ts';
import { matchesTournamentPlayers, normalizeTournamentSearch } from '../src/lib/tournament-search.ts';
import { contentSchemas, currentEdition } from '../src/lib/content-rules.ts';
import { validateContent } from '../scripts/check-content.ts';

const pair = {
  position: 1,
  players: [
    { name: 'Testovací hráč', club: 'Zkušební oddíl', full: 600, spares: 300, errors: 5, total: 900 },
    { name: 'Druhý hráč', club: 'Jiný oddíl', full: 580, spares: 280, errors: 8, total: 860 },
  ],
  full: 1180, spares: 580, errors: 13, total: 1760,
};
const group = { id: 'celkove', label: 'Testovací pořadí', pairs: [pair] };
test('structured results validate complete pair arithmetic while preserving printed ties and repeats', () => {
  assert.equal(tournamentResults.parse([group])[0]!.pairs.length, 1);
  assert.equal(tournamentResults.parse([{ ...group, pairs: [pair, { ...pair, note: 'Opakované místo ve zdroji.' }] }])[0]!.pairs.length, 2);
  for (const change of [
    { total: 0 }, { full: 1 }, { spares: 1 }, { errors: 1 }, { position: 0 },
    { players: [pair.players[0]] }, { players: [...pair.players, pair.players[0]] },
    { players: [{ ...pair.players[0], total: 901 }, pair.players[1]] },
    { players: [{ ...pair.players[0], name: '' }, pair.players[1]] },
    { players: [{ ...pair.players[0], errors: -1 }, pair.players[1]] },
    { category: { label: 'Ženy', position: 0 } }, { internalRegistration: 'Not part of content' },
  ]) assert.equal(tournamentResults.safeParse([{ ...group, pairs: [{ ...pair, ...change }] }]).success, false, JSON.stringify(change));
  assert.equal(tournamentResults.safeParse([group, group]).success, false);
  assert.equal(tournamentResults.safeParse([{ ...group, pairs: [] }]).success, false);
});

test('player search ignores Czech marks, case and name order without matching words across partners', () => {
  const players = ['Hažva Jaroslav KK Slavoj Praha', 'Mašková Blanka TJ Sokol Chýnov'];
  assert.equal(normalizeTournamentSearch('  CHÝNOV\tHaŽva  '), 'chynov hazva');
  for (const query of ['', '   ', 'jaroslav hazva', 'HAŽVA', 'maskova blan', 'chynov blanka', 'slavoj praha', 'sokol']) assert.equal(matchesTournamentPlayers(players, query), true, query);
  for (const query of ['nenalezeno', 'jaroslav blanka', 'hazva chynov', 'maskova praha']) assert.equal(matchesTournamentPlayers(players, query), false, query);
});

test('historical-only editions remain in the archive without becoming the current tournament', () => {
  const schema = contentSchemas(z.string()).tournaments;
  const archived = schema.parse({ year: 2025, description: 'Archivní výsledky.', archived: true });
  const announced = schema.parse({ year: 2024, description: 'Test aktuálního ročníku.' });
  assert.deepEqual(announced.results, []);
  assert.equal(currentEdition([{ data: archived }]), undefined);
  assert.equal(currentEdition([{ data: archived }, { data: announced }])?.data.year, 2024);
  assert.equal(schema.safeParse({ ...archived, isCurrent: true }).success, false);
  assert.equal(currentEdition([{ data: { ...announced, draft: true } }, { data: archived }]), undefined);
});

test('supplied archive retains every start, category and documented source discrepancy', () => {
  const editions = validateContent().tournaments;
  const results = (year: number) => editions.find(e => e.data.year === year)!.data.results;
  const pairs = (year: number) => results(year).flatMap(g => g.pairs);
  assert.deepEqual([2021, 2023, 2025].map(y => pairs(y).length), [63, 65, 91]);
  assert.deepEqual(results(2023).map(g => [g.label, g.pairs.length]), [['Muži', 46], ['Ženy', 3], ['Smíšené', 16]]);
  assert.deepEqual(['Muži', 'Ženy', 'Smíšené'].map(label => pairs(2025).filter(p => p.category?.label === label).length), [54, 11, 26]);
  assert.equal(pairs(2021)[0]!.total, 2023);
  assert.equal(pairs(2023)[0]!.total, 2051);
  assert.equal(pairs(2025)[0]!.total, 2095);
  assert.equal(pairs(2021)[49]!.position, 40);
  assert.match(pairs(2021)[49]!.note!, /49.*51/);
  const conflict = pairs(2025).find(p => p.position === 83)!;
  assert.equal(conflict.players[1].errors, 20); assert.equal(conflict.errors, 38);
  assert.match(conflict.note!, /15 a 33/);
  assert.equal(conflict.category?.position, 9);
  const repeated = pairs(2025).filter(p => matchesTournamentPlayers(p.players.map(p => `${p.name} ${p.club}`), 'jaroslav hazva'));
  assert.ok(repeated.length > 1);
  assert.ok(repeated.every(p => p.players.length === 2));
  for (const e of editions.filter(e => [2021, 2023, 2025].includes(e.data.year))) {
    assert.equal(e.data.archived, true); assert.equal(e.data.qualifiesForMcr, undefined);
  }
});
