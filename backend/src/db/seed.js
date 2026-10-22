/**
 * Seed runner.
 *
 *   npm run seed        essential data only (settings, admin, categories) - safe in production
 *   npm run seed:demo   essential + demo content (posts, photos, videos...) - development only
 *
 * Both are idempotent.
 */
import { pathToFileURL } from 'node:url';
import { tx, closePool } from './pool.js';
import { migrateUp } from './migrate.js';
import { seedEssential } from './seeds/essential.js';
import { seedDemo } from './seeds/demo.js';

export async function runSeeds({ demo = false, log = console.log } = {}) {
  await tx(async (db) => {
    log('essential seed:');
    await seedEssential(db, log);
    if (demo) {
      log('demo seed:');
      await seedDemo(db, log);
    }
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    // Make sure the schema exists first, so `npm run seed` works on a fresh database.
    await migrateUp({ log: () => {} });
    await runSeeds({ demo: process.argv.includes('--demo') });
    console.log('done');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
