import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Both database drivers ship native/WASM assets that must not be bundled —
   * Next loads them from node_modules at runtime instead.
   */
  serverExternalPackages: ['postgres', '@electric-sql/pglite', 'nodemailer'],

  // Images are served from /public. Add a host here if the conference ever
  // uploads photography to external storage.
  images: { remotePatterns: [] },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
