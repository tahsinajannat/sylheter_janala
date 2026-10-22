import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAny, signToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { hashPassword, verifyPassword } from '../services/passwords.js';
import { conflict, unauthorized } from '../utils/errors.js';
import { lang } from '../utils/schemas.js';

const router = Router();

const email = z.string().trim().toLowerCase().email().max(254);
// bcrypt only uses the first 72 bytes, so don't accept longer passwords that would be silently truncated.
const newPassword = z.string().min(8, 'Password must be at least 8 characters').max(72);
const credentials = z.object({ email, password: z.string().min(1).max(72) });

// ───────────────────────── staff (admin / editor / author) ─────────────────────────

router.post('/login', authLimiter, validate({ body: credentials }), async (req, res) => {
  const { email: e, password } = req.valid.body;
  const { rows } = await query('SELECT id, name, email, role, password_hash FROM users WHERE email = $1 AND is_active', [e]);
  const user = rows[0];
  if (!(await verifyPassword(password, user?.password_hash))) throw unauthorized('Incorrect email or password');

  res.json({
    data: {
      token: signToken({ id: user.id, kind: 'staff', role: user.role }),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// ───────────────────────── readers (public visitors) ─────────────────────────

router.post(
  '/reader/register',
  authLimiter,
  validate({ body: z.object({ name: z.string().trim().min(2).max(80), email, password: newPassword, preferredLang: lang.optional() }) }),
  async (req, res) => {
    const { name, email: e, password, preferredLang } = req.valid.body;
    let reader;
    try {
      ({
        rows: [reader],
      } = await query(
        `INSERT INTO readers (name, email, password_hash, preferred_lang)
         VALUES ($1, $2, $3, $4) RETURNING id, name, email, preferred_lang`,
        [name, e, await hashPassword(password), preferredLang ?? 'bn'],
      ));
    } catch (err) {
      if (err.code === '23505') throw conflict('This email is already registered');
      throw err;
    }
    res.status(201).json({
      data: {
        token: signToken({ id: reader.id, kind: 'reader' }),
        reader: { id: reader.id, name: reader.name, email: reader.email, preferredLang: reader.preferred_lang },
      },
    });
  },
);

router.post('/reader/login', authLimiter, validate({ body: credentials }), async (req, res) => {
  const { email: e, password } = req.valid.body;
  const { rows } = await query(
    'SELECT id, name, email, preferred_lang, password_hash FROM readers WHERE email = $1 AND is_active',
    [e],
  );
  const reader = rows[0];
  if (!(await verifyPassword(password, reader?.password_hash))) throw unauthorized('Incorrect email or password');

  res.json({
    data: {
      token: signToken({ id: reader.id, kind: 'reader' }),
      reader: { id: reader.id, name: reader.name, email: reader.email, preferredLang: reader.preferred_lang },
    },
  });
});

// ───────────────────────── who am I ─────────────────────────

router.get('/me', requireAny, (req, res) => {
  const { id, name, email: e, kind, role } = req.auth;
  res.json({ data: { id, name, email: e, kind, ...(role ? { role } : {}) } });
});

export default router;
