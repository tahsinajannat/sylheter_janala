import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './db/pool.js';
import { migrateUp } from './db/migrate.js';
import { startJobs } from './jobs/index.js';

if (env.RUN_MIGRATIONS_ON_START) {
  console.log('[boot] running migrations');
  await migrateUp();
}

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`[boot] API listening on :${env.PORT} (${env.NODE_ENV})`);
  if (!env.cloudinaryEnabled) console.log('[boot] Cloudinary not configured: image uploads disabled');
  if (!env.smtpEnabled) console.log('[boot] SMTP not configured: emails are printed to this log');
});

const stopJobs = startJobs();

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[boot] ${signal} received, shutting down`);
  stopJobs();
  // Stop accepting new connections, let in-flight requests finish (max 10 s).
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await closePool().catch(() => {});
    process.exit(0);
  });
  server.closeIdleConnections?.();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => console.error('[boot] unhandledRejection', err));
