import { badRequest } from '../utils/errors.js';

const TAG_LINKS = { post_tags: 'post_id', photo_card_tags: 'photo_card_id' };

/**
 * Replace the tags of a post / photo card. Tags must exist and be in the same language.
 * `db` is a transaction client.
 */
export async function syncTags(db, linkTable, ownerId, lang, tagIds) {
  const ownerColumn = TAG_LINKS[linkTable];
  if (!ownerColumn) throw new Error(`syncTags: unsupported table ${linkTable}`);
  const ids = [...new Set(tagIds)];

  if (ids.length > 0) {
    const { rows } = await db.query('SELECT count(*)::int AS n FROM tags WHERE id = ANY($1::uuid[]) AND lang = $2', [ids, lang]);
    if (rows[0].n !== ids.length) throw badRequest('Some tags do not exist or are in a different language');
  }
  await db.query(`DELETE FROM ${linkTable} WHERE ${ownerColumn} = $1`, [ownerId]);
  if (ids.length > 0) {
    await db.query(
      `INSERT INTO ${linkTable} (${ownerColumn}, tag_id) SELECT $1, unnest($2::uuid[]) ON CONFLICT DO NOTHING`,
      [ownerId, ids],
    );
  }
}

/** A post/photo/video may only use a category of its own language. */
export async function assertCategoryLang(db, categoryId, lang) {
  if (!categoryId) return;
  const { rows } = await db.query('SELECT lang FROM categories WHERE id = $1', [categoryId]);
  if (!rows[0]) throw badRequest('Category does not exist');
  if (rows[0].lang !== lang) throw badRequest('Category language must match the content language');
}
