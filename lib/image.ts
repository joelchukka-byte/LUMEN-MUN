/**
 * Placeholder photography.
 *
 * Every image on the site comes from the database. Where a record has no image
 * yet (which is everything until Edition I actually happens) these local files
 * stand in, so the layout was designed against real photographs rather than
 * empty boxes.
 *
 * They are held locally rather than hot-linked: no external dependency, no
 * layout shift on a slow third party, and the site renders complete offline.
 * The stylesheet renders them in monochrome, which is both the art direction
 * and the reason a set of unrelated photographs reads as one set.
 *
 * To replace one, set the record's `image` column to any path or URL. Nothing
 * else changes. Remote hosts need adding to `images.remotePatterns` first.
 */

const POOL = [
  '/img/placeholder/committee-a.jpg',
  '/img/placeholder/committee-b.jpg',
  '/img/placeholder/committee-c.jpg',
  '/img/placeholder/gallery-1.jpg',
  '/img/placeholder/gallery-2.jpg',
  '/img/placeholder/gallery-3.jpg',
  '/img/placeholder/gallery-4.jpg',
  '/img/placeholder/portrait-a.jpg',
  '/img/placeholder/portrait-b.jpg',
] as const;

/** Named stand-ins for the few slots that want a specific frame. */
const NAMED: Record<string, string> = {
  'assembly-floor': '/img/placeholder/assembly-floor.jpg',
};

/** Stable per-seed pick, so a committee keeps the same photo across renders. */
function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholderImage(seed: string) {
  return NAMED[seed] ?? POOL[hash(seed) % POOL.length];
}

/** The record's own image, or a stable stand-in keyed to its slug. */
export function imageOr(image: string | null | undefined, seed: string) {
  return image || placeholderImage(seed);
}

/** True when the rendered image is a stand-in rather than real conference photography. */
export function isPlaceholder(image: string | null | undefined) {
  return !image;
}
