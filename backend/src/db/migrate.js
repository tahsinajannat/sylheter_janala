/**
 * Minimal, dependency-free SQL migration runner (no ORM).
 *
 *   npm run migrate              apply all pending migrations
 *   npm run migrate:status       list applied / pending migrations
 *   npm run migrate:create name  create the next empty migration file
 *   npm run db:reset             DROP everything and start over (never in production)
 *
 * Rules
 *   - Migrations are plain .sql files in ./migrations, applied in filename order.
 *   - Each file runs in its own transaction (don't put BEGIN/COMMIT in the file).
 *   - Applied files are checksummed; editing an applied migration is an error.
 *     Write a new migration instead.
 *   - A Postgres advisory lock makes concurrent runs (e.g. several containers
 *     booting at once) safe: the others wait, then find nothing left to do.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pool, closePool } from './pool.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const LOCK_KEY = 727_274_001; // arbitrary app-specific advisory lock id

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

async function listFiles() {
  const names = await fs.readdir(MIGRATIONS_DIR);
  return names.filter((n) => /^\d+_.+\.sql$/.test(n)).sort();
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         serial PRIMARY KEY,
      name       text        NOT NULL UNIQUE,
      checksum   text        NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

export async function migrateUp({ log = console.log } = {}) {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await ensureTable(client);

    const { rows } = await client.query('SELECT name, checksum FROM schema_migrations');
    const applied = new Map(rows.map((r) => [r.name, r.checksum]));
    let count = 0;

    for (const name of await listFiles()) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), 'utf8');
      const checksum = sha256(sql);

      if (applied.has(name)) {
        if (applied.get(name) !== checksum) {
          throw new Error(
            `Migration ${name} was modified after being applied. Revert the change and add a new migration instead.`,
          );
        }
        continue;
      }

      log(`  applying ${name} ...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        err.message = `Migration ${name} failed: ${err.message}`;
        throw err;
      }
      count += 1;
    }

    log(count === 0 ? '  database is up to date' : `  applied ${count} migration(s)`);
    return count;
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    } finally {
      client.release();
    }
  }
}

async function status() {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const { rows } = await client.query('SELECT name, checksum, applied_at FROM schema_migrations');
    const applied = new Map(rows.map((r) => [r.name, r]));
    for (const name of await listFiles()) {
      const row = applied.get(name);
      console.log(row ? `  [x] ${name}  (${row.applied_at.toISOString()})` : `  [ ] ${name}  pending`);
    }
  } finally {
    client.release();
  }
}

async function create(rawName) {
  const name = (rawName ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!name) throw new Error('Usage: npm run migrate:create <name>   e.g. add_comment_likes');
  const files = await listFiles();
  const last = files.length ? parseInt(files[files.length - 1].split('_')[0], 10) : 0;
  const file = `${String(last + 1).padStart(3, '0')}_${name}.sql`;
  await fs.writeFile(path.join(MIGRATIONS_DIR, file), `-- ${file}\n\n`, { flag: 'wx' });
  console.log(`  created src/db/migrations/${file}`);
}

async function reset() {
  if (env.isProd) throw new Error('Refusing to reset the database when NODE_ENV=production');
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log('  schema dropped and recreated (run `npm run migrate` next)');
}

// ---- CLI ----
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [cmd = 'up', arg] = process.argv.slice(2);
  const commands = { up: () => migrateUp(), status, create: () => create(arg), reset };
  try {
    if (!commands[cmd]) throw new Error(`Unknown command "${cmd}". Use: up | status | create <name> | reset`);
    await commands[cmd]();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
