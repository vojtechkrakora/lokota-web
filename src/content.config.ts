import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentSchemas } from './lib/content-rules.ts';
import { publishedGlob } from './lib/published-loader.ts';

// Keep loader IDs based on file paths: explicit public slugs are validated separately.
const news = defineCollection({ loader: publishedGlob('./src/content/news'), schema: ({ image }) => contentSchemas(image()).news });
const tournaments = defineCollection({ loader: publishedGlob('./src/content/tournaments'), schema: ({ image }) => contentSchemas(image()).tournaments });
const club = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/club' }), schema: ({ image }) => contentSchemas(image()).club });
export const collections = { news, tournaments, club };
