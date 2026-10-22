import { createHash } from 'node:crypto';

/**
 * Stable UUID derived from a string. Used so seeds can link the bn/en versions
 * of the same story (translation_key) idempotently, without lookups.
 */
export function deterministicUuid(input) {
  const h = createHash('sha1').update(`sylheter-janala:${input}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
