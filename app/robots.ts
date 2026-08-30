import type { MetadataRoute } from 'next';

const base = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing behind a login, and nothing that only makes sense to one person.
      disallow: ['/admin', '/dashboard', '/api/', '/login', '/reset-password', '/verify-email'],
    },
    sitemap: `${base()}/sitemap.xml`,
  };
}
