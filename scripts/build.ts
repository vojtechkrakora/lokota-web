import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { writeSports } from './prepare-sports.ts';
import { validateContent } from './check-content.ts';
import { checkOutput } from './check-output.ts';

// Offline output has a separate directory and is never the Pages publication artifact.
const fixture = process.argv.includes('--fixture');
if (fixture && process.env.CF_PAGES) throw new Error('Fixture builds are forbidden on Pages');
const outDir = fixture ? '.cache/offline-dist' : 'dist';
await rm(outDir, { recursive: true, force: true });
validateContent();
const data = await writeSports(fixture);
const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir], { stdio: 'inherit', env: { ...process.env, LOKOTA_BUILD_PROVENANCE: data.provenance } });
if (result.status !== 0) process.exit(result.status ?? 1);
await checkOutput(outDir, data.provenance);
