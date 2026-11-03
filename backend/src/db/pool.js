import pg from 'pg';
import { env } from '../config/env.js';

// COUNT(*) etc. come back as bigint -> return JS numbers (our counts are small).
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
// `date` columns -> plain 'YYYY-MM-DD' strings instead of Date objects (no timezone surprises).
pg.types.setTypeParser(1082, (v) => v);
console.log('[DB DEBUG]', {
  databaseUrlExists: Boolean(env.DATABASE_URL),
  hostname: env.DATABASE_URL
    ? new URL(env.DATABASE_URL).hostname
    : 'MISSING',
  database: env.DATABASE_URL
    ? new URL(env.DATABASE_URL).pathname
    : 'MISSING',
  ssl: env.DB_SSL,
});
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.DB_SSL ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED } : false,
});

pool.on('error', (err) => {
  // An idle client errored (e.g. DB restarted). The pool discards it; just log.
  console.error('[db] idle client error:', err.message);
});

/** Run a single query. */
export const query = (text, params) => pool.query(text, params);

/** Run `fn(client)` inside a transaction. Rolls back if it throws. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* connection already broken */
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
