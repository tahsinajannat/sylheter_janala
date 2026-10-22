import { randomBytes } from 'node:crypto';

/**
 * Unicode-aware slug. Keeps Bangla letters AND combining marks (\p{M}) -
 * vowel signs like ি ো ্ are marks, dropping them would corrupt the word.
 */
export function slugify(input, maxLength = 80) {
  const s = String(input ?? '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return Array.from(s).slice(0, maxLength).join('').replace(/-+$/, '');
}

export const shortId = () => randomBytes(3).toString('hex');

const SLUG_TABLES = new Set(['posts', 'photo_cards', 'videos', 'categories', 'tags']);

/**
 * Returns a slug that is free for (table, lang). Appends a short suffix on collision.
 * `db` is a pg Pool or a transaction client.
 */
export async function uniqueSlug(db, table, lang, base) {
  if (!SLUG_TABLES.has(table)) throw new Error(`uniqueSlug: unsupported table ${table}`);
  const root = base || `item-${shortId()}`;
  let candidate = root;
  for (let i = 0; i < 5; i += 1) {
    const { rowCount } = await db.query(`SELECT 1 FROM ${table} WHERE lang = $1 AND slug = $2`, [lang, candidate]);
    if (rowCount === 0) return candidate;
    candidate = `${root}-${shortId()}`;
  }
  return candidate;
}
