import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { datasetSchema } from './sports.ts';

export function readSports() {
  try {
    const data = datasetSchema.parse(JSON.parse(readFileSync(resolve(process.cwd(), '.cache/sports.json'), 'utf8')));
    if (process.env.LOKOTA_BUILD_PROVENANCE && data.provenance !== process.env.LOKOTA_BUILD_PROVENANCE) throw new Error('Wrong dataset provenance');
    return data;
  } catch (cause) { throw new Error('Fresh sports dataset missing or invalid. Use npm run dev/build (dev:offline/build:offline for explicit fixtures).', { cause }); }
}
