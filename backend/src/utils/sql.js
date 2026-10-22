import { badRequest } from './errors.js';

/**
 * Build the SET part of a partial UPDATE from a whitelist map.
 *
 *   const { sets, values } = buildUpdate(body, { title: 'title', isHero: 'is_hero' }, 2);
 *   await query(`UPDATE posts SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
 *
 * Only keys present in `map` AND defined in `data` are used, so column names never
 * come from user input. `startAt` is the first free $n placeholder.
 */
export function buildUpdate(data, map, startAt = 1) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) {
      values.push(data[key]);
      sets.push(`${column} = $${startAt + values.length - 1}`);
    }
  }
  if (sets.length === 0) throw badRequest('No fields to update');
  return { sets, values };
}
