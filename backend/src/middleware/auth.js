import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { forbidden, unauthorized } from '../utils/errors.js';

const ISSUER = 'sylheter-janala';

/**
 * Two kinds of accounts, two tables:
 *   kind 'staff'  -> users   (admin | editor | author)
 *   kind 'reader' -> readers (public visitors)
 */
export const signToken = ({ id, kind, role }) =>
  jwt.sign({ kind, ...(role ? { role } : {}) }, env.JWT_SECRET, {
    subject: id,
    issuer: ISSUER,
    expiresIn: env.JWT_EXPIRES_IN,
  });

/** Resolve the bearer token to a live account, or null when no token is sent. */
async function resolveAuth(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith('Bearer ')) throw unauthorized('Malformed Authorization header');

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET, { issuer: ISSUER });
  } catch {
    throw unauthorized('Invalid or expired token');
  }

  // Look the account up on every request so deactivating a user takes effect immediately.
  if (payload.kind === 'staff') {
    const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1 AND is_active', [payload.sub]);
    if (!rows[0]) throw unauthorized('Account not found or disabled');
    return { kind: 'staff', ...rows[0] };
  }
  if (payload.kind === 'reader') {
    const { rows } = await query('SELECT id, name, email FROM readers WHERE id = $1 AND is_active', [payload.sub]);
    if (!rows[0]) throw unauthorized('Account not found or disabled');
    return { kind: 'reader', ...rows[0] };
  }
  throw unauthorized('Invalid token');
}

/** Staff only. Pass roles to restrict further: requireStaff('admin', 'editor'). */
export const requireStaff =
  (...roles) =>
  async (req, _res, next) => {
    const auth = await resolveAuth(req);
    if (!auth) throw unauthorized();
    if (auth.kind !== 'staff') throw forbidden('Staff account required');
    if (roles.length > 0 && !roles.includes(auth.role)) throw forbidden();
    req.auth = auth;
    next();
  };

/** After requireStaff(): restrict a single route to some roles. allow('admin', 'editor') */
export const allow =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.auth?.role)) throw forbidden();
    next();
  };

export const requireReader = async (req, _res, next) => {
  const auth = await resolveAuth(req);
  if (!auth) throw unauthorized();
  if (auth.kind !== 'reader') throw forbidden('Reader account required');
  req.auth = auth;
  next();
};

/** Either kind of account. */
export const requireAny = async (req, _res, next) => {
  const auth = await resolveAuth(req);
  if (!auth) throw unauthorized();
  req.auth = auth;
  next();
};
