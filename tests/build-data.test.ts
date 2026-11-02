import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeSports } from '../scripts/prepare-sports.ts';
import { fixtureSports } from './fixtures/sports.ts';

test('preparation removes old input before failure; first-build errors leave no usable dataset', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lokota-build-'));
  const destination = pathToFileURL(join(directory, 'sports.json'));
  try {
    for (const existing of [false, true]) {
      if (existing) await writeFile(destination, JSON.stringify(fixtureSports()));
      await assert.rejects(writeSports(false, { destination, prepare: async () => { throw new Error('Simulated required schema/API failure'); } }), /Simulated/);
      await assert.rejects(readFile(destination), /ENOENT/);
    }
    const live = { ...fixtureSports(), provenance: 'live' as const };
    await writeSports(false, { destination, prepare: async () => live });
    assert.equal(JSON.parse(await readFile(destination, 'utf8')).provenance, 'live');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
