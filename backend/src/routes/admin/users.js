import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { hashPassword } from '../../services/passwords.js';
import { badRequest, conflict, notFound } from '../../utils/errors.js';
import { idParams, optionalText } from '../../utils/schemas.js';
import { buildUpdate } from '../../utils/sql.js';

// Staff account management - admin only (enforced in admin/index.js).
const router = Router();

const ROLE = z.enum(['admin', 'editor', 'author']);
const fields = {
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  role: ROLE,
  bio: optionalText(500),
  isActive: z.boolean(),
};
const shape = (r) => ({ id: r.id, name: r.name, email: r.email, role: r.role, bio: r.bio, isActive: r.is_active, createdAt: r.created_at });

router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT id, name, email, role, bio, is_active, created_at FROM users ORDER BY created_at');
  res.json({ data: rows.map(shape) });
});

router.post('/', validate({ body: z.object({ name: fields.name, email: fields.email, password: fields.password, role: ROLE.default('author'), bio: fields.bio }) }), async (req, res) => {
  const b = req.valid.body;
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, bio) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, role, bio, is_active, created_at`,
      [b.name, b.email, await hashPassword(b.password), b.role, b.bio ?? null],
    );
    res.status(201).json({ data: shape(rows[0]) });
  } catch (err) {
    if (err.code === '23505') throw conflict('A staff account with this email already exists');
    throw err;
  }
});

router.patch(
  '/:id',
  validate({ params: idParams, body: z.object({ name: fields.name, role: fields.role, bio: fields.bio, isActive: fields.isActive, password: fields.password }).partial() }),
  async (req, res) => {
    const { id } = req.valid.params;
    const b = req.valid.body;

    // Don't let an admin lock themselves out.
    if (id === req.auth.id && ((b.role && b.role !== 'admin') || b.isActive === false)) {
      throw badRequest('You cannot demote or deactivate your own account');
    }

    const data = { ...b };
    if (b.password !== undefined) data.passwordHash = await hashPassword(b.password);
    const { sets, values } = buildUpdate(data, { name: 'name', role: 'role', bio: 'bio', isActive: 'is_active', passwordHash: 'password_hash' }, 2);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $1 RETURNING id, name, email, role, bio, is_active, created_at`,
      [id, ...values],
    );
    if (!rows[0]) throw notFound('User');
    res.json({ data: shape(rows[0]) });
  },
);

export default router;
