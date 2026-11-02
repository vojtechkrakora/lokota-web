import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prepareSports } from '../src/lib/sports.ts';
import { prepareClubLogos } from './prepare-club-logos.ts';

export const datasetPath = new URL('../.cache/sports.json', import.meta.url);
export async function writeSports(fixture = false, options: { prepare?: typeof prepareSports; destination?: URL } = {}) {
  const destination = options.destination ?? datasetPath;
  // Remove prior build input before retrieval, so a failed new build cannot reuse it.
  await rm(destination, { force: true });
  const data = fixture ? (await import('../tests/fixtures/sports.ts')).fixtureSports() : await (options.prepare ?? prepareSports)();
  const logos = await prepareClubLogos(data, { directory: new URL('./club-logos/', destination) });
  await mkdir(new URL('./', destination), { recursive: true });
  const temp = new URL(`./sports-${process.pid}.tmp`, destination);
  try {
    await writeFile(temp, JSON.stringify(data));
    await rename(temp, destination);
  } finally { await rm(temp, { force: true }); }
  console.log(`Sports prepared (${data.provenance}): ${data.season.name}, ${data.matches.length} matches, ${data.teams.length} club teams.`);
  console.log(`Club logos prepared: ${logos} opponent emblems; the club uses its supplied logo.`);
  return data;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await writeSports(process.argv.includes('--fixture')); }
  catch (error) { console.error(error instanceof Error ? error.message : 'Sports preparation failed'); process.exitCode = 1; }
}
