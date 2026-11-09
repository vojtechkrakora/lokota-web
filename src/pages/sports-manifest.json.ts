import type { APIRoute } from 'astro';
import { sportsManifest } from '../lib/sports-manifest.ts';

export const GET: APIRoute = async () => {
  return Response.json(await sportsManifest());
};
