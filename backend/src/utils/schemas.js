import { z } from 'zod';

export const lang = z.enum(['bn', 'en']);
export const uuid = z.string().uuid();
export const idParams = z.object({ id: uuid });

/** URL slug param. Bangla slugs arrive percent-decoded; normalise to NFC to match what we stored. */
export const slugParam = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .transform((s) => s.normalize('NFC'));

export const optionalText = (max) => z.string().trim().max(max).nullish();

/** Escape % and _ so user text is matched literally inside ILIKE. */
export const likePattern = (text) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;
