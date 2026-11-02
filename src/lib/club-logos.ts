import type { ImageMetadata } from 'astro';
import clubLogo from '../assets/club-logo.jpg';
import { site } from '../site.ts';

// Prepared before Astro starts; there are no browser requests to the ČKA image host.
const images = import.meta.glob<{ default: ImageMetadata }>('../../.cache/club-logos/*.webp', { eager: true });
export function clubEmblem(clubId: number): ImageMetadata | undefined {
  return clubId === site.clubId ? clubLogo : images[`../../.cache/club-logos/${clubId}.webp`]?.default;
}
