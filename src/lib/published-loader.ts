import { glob, type Loader } from 'astro/loaders';

export function publishedGlob(base: string): Loader {
  const loader = glob({ pattern: '**/*.md', base });
  return {
    name: `published-${loader.name}-${base}`,
    async load(context) {
      // Astro can emit original images from a collection even when pages filter
      // drafts. Validate every entry, but keep drafts out of its public asset store.
      for (const entry of context.store.values()) if (entry.data.draft) context.store.delete(entry.id);
      await loader.load({ ...context, store: { ...context.store, set(entry) {
        if (entry.data.draft) { context.store.delete(entry.id); return false; }
        return context.store.set(entry);
      } } });
    },
  };
}
