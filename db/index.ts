/**
 * Database connection.
 *
 * Production / staging — set DATABASE_URL to the Supabase Postgres connection
 * string (Project Settings → Database → Connection string → URI, "Session"
 * pooler). The app talks to Postgres directly with Drizzle rather than through
 * the Supabase JS client, so the same schema and queries run anywhere Postgres
 * runs.
 *
 * Local development — with no DATABASE_URL, this falls back to PGlite: a real
 * Postgres compiled to WASM, persisted under .pglite/. Same SQL, same Drizzle
 * queries, no external account needed to run or seed the site. It is a
 * developer convenience only; deployments must set DATABASE_URL.
 *
 * The connection is created lazily, on first query rather than on import, for
 * two reasons: `next build` can then compile without a database reachable, and
 * only the driver actually in use is ever resolved — production never pulls in
 * the WASM build.
 */

import { createRequire } from 'node:module';
import { drizzle as drizzlePg, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

const require = createRequire(import.meta.url);

export type Database = PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;
export type DbKind = 'postgres' | 'pglite';

/** Cached across hot reloads so dev doesn't exhaust the connection pool. */
const globalForDb = globalThis as unknown as {
  __lumenDb?: Database;
  __lumenDbKind?: DbKind;
};

function createDatabase(): Database {
  const url = process.env.DATABASE_URL;

  if (url) {
    const postgres = require('postgres');
    const client = postgres(url, {
      // Supabase's transaction pooler does not support prepared statements.
      prepare: false,
      max: process.env.NODE_ENV === 'production' ? 10 : 3,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    globalForDb.__lumenDbKind = 'postgres';
    return drizzlePg(client, { schema });
  }

  // Refuse to run a real deployment on the embedded database by accident. Set
  // ALLOW_PGLITE=1 to override — useful for smoke-testing a production build
  // locally, never for an actual deploy.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PGLITE !== '1') {
    throw new Error(
      'DATABASE_URL is not set. Point it at your Supabase Postgres connection string ' +
        '(or set ALLOW_PGLITE=1 to build against the local embedded database).'
    );
  }

  const { PGlite } = require('@electric-sql/pglite');
  globalForDb.__lumenDbKind = 'pglite';
  return drizzlePglite(new PGlite('.pglite'), { schema });
}

function connection(): Database {
  return (globalForDb.__lumenDb ??= createDatabase());
}

/**
 * Drizzle's query builder, connected on first use.
 *
 * The proxy exists so that importing this module is free — `next build` walks
 * every route's imports, and eagerly opening a connection there would fail any
 * build run without a reachable database.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(connection() as object, property, receiver);
  },
  has(_target, property) {
    return Reflect.has(connection() as object, property);
  },
});

/** Which driver is live — surfaced on the admin console's header. */
export const dbKind = (): DbKind | 'unknown' => globalForDb.__lumenDbKind ?? 'unknown';

export * from './schema';
export { schema };
