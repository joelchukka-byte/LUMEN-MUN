import type { MetadataRoute } from 'next';
import { getCommittees } from '@/lib/content';

const base = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Built from the database, so a new committee appears without a redeploy. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A sitemap missing its committee pages is better than a failed deploy; the
  // static routes below never depend on the database.
  let committees: Awaited<ReturnType<typeof getCommittees>> = [];
  try {
    committees = await getCommittees();
  } catch (error) {
    console.warn('[sitemap] committees unavailable:', error);
  }

  const now = new Date();

  const pages: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
    ['', 1, 'weekly'],
    ['/about', 0.7, 'monthly'],
    ['/committees', 0.9, 'weekly'],
    ['/schedule', 0.8, 'weekly'],
    ['/secretariat', 0.6, 'monthly'],
    ['/register', 0.9, 'daily'],
    ['/forms', 0.5, 'monthly'],
    ['/faq', 0.6, 'monthly'],
    ['/sponsors', 0.6, 'monthly'],
    ['/press', 0.5, 'monthly'],
    ['/contact', 0.5, 'monthly'],
  ];

  return [
    ...pages.map(([path, priority, changeFrequency]) => ({
      url: `${base()}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...committees.map((c) => ({
      url: `${base()}/committees/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
