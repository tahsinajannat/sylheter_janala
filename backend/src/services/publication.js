import { badRequest, forbidden } from '../utils/errors.js';

/**
 * Decide the published_at value for a status change.
 *   scheduled  -> needs a future time
 *   published  -> now (or the given past time); future times must use "scheduled"
 *   draft/arch -> keep whatever was there
 */
export function resolvePublishedAt(status, given, existing = null) {
  const now = new Date();
  if (status === 'scheduled') {
    const when = given ?? existing;
    if (!when || new Date(when) <= now) throw badRequest('Scheduled items need a publish time in the future');
    return new Date(when);
  }
  if (status === 'published') {
    if (given && new Date(given) > now) throw badRequest('For a future date use status "scheduled"');
    if (given) return new Date(given);
    return existing && new Date(existing) <= now ? new Date(existing) : now;
  }
  return given === undefined ? (existing ?? null) : given;
}

/**
 * Authors write drafts; editors/admins publish.
 *  - authors may only create/edit their own drafts and may not publish or schedule
 */
export function assertCanWrite(auth, { existing, newStatus }) {
  if (auth.role !== 'author') return;
  if (newStatus && !['draft'].includes(newStatus)) {
    throw forbidden('Authors can only save drafts; an editor must publish');
  }
  if (existing && !(existing.author_id === auth.id && existing.status === 'draft')) {
    throw forbidden('Authors can only edit their own drafts');
  }
}
