import bcrypt from 'bcryptjs';

const COST = 12;

export const hashPassword = (plain, cost = COST) => bcrypt.hash(plain, cost);

// Compared against when the account doesn't exist, so response time doesn't reveal
// whether an email is registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);

/** Constant-ish time verify; `hash` may be null/undefined (unknown user, Google-only reader). */
export async function verifyPassword(plain, hash) {
  const ok = await bcrypt.compare(plain, hash || DUMMY_HASH);
  return Boolean(hash) && ok;
}
