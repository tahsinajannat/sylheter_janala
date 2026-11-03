
/**
 * Seed runner without migrations.
 *
 * Usage:
 *   npm run seed:no-migrate
 *   npm run seed:demo:no-migrate
 */
import { pathToFileURL } from 'node:url';
import { tx, closePool } from './pool.js';
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

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    await runSeeds({
      demo: process.argv.includes('--demo'),
    });

    console.log('done');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
