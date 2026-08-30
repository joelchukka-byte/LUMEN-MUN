import type { Config } from 'drizzle-kit';

/**
 * `npm run db:generate` writes SQL migrations to ./drizzle.
 * `npm run db:push`     applies the schema straight to the target database.
 *
 * With DATABASE_URL set both act on Supabase; without it they act on the local
 * PGlite database under .pglite/.
 */
const url = process.env.DATABASE_URL;

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(url
    ? { dbCredentials: { url } }
    : { driver: 'pglite' as const, dbCredentials: { url: '.pglite' } }),
  strict: true,
  verbose: true,
} satisfies Config;
