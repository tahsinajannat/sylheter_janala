import { query } from '../db/pool.js';
import { processNewsletterBatch } from './newsletterWorker.js';

/** Flip scheduled content to published once its time has come. Idempotent, safe on many instances. */
export async function publishScheduled() {
  for (const table of ['posts', 'photo_cards', 'videos']) {
    const { rowCount } = await query(`UPDATE ${table} SET status = 'published' WHERE status = 'scheduled' AND published_at <= now()`);
    if (rowCount) console.log(`[jobs] published ${rowCount} scheduled row(s) in ${table}`);
  }
}

function every(ms, name, fn) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return; // never overlap
    running = true;
    try {
      await fn();
    } catch (err) {
      console.error(`[jobs] ${name} failed:`, err.message);
    } finally {
      running = false;
    }
  }, ms);
  timer.unref();
  return timer;
}

/** Start in-process background jobs. Returns a stop() function. */
export function startJobs() {
  const timers = [
    every(60_000, 'publishScheduled', publishScheduled),
    every(15_000, 'newsletter', processNewsletterBatch),
  ];
  return () => timers.forEach(clearInterval);
}
