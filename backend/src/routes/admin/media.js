import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { allow } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, destroyImage, uploadImage } from '../../services/cloudinary.js';
import { HttpError, badRequest, conflict, notFound } from '../../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams } from '../../utils/schemas.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(new HttpError(415, 'Only JPEG, PNG, WebP, GIF or AVIF images are allowed')),
});

const meta = z.object({ alt: z.string().trim().max(250).optional(), caption: z.string().trim().max(500).optional() });
const shape = (r) => ({
  id: r.id,
  url: r.url,
  width: r.width,
  height: r.height,
  bytes: r.bytes,
  format: r.format,
  alt: r.alt,
  caption: r.caption,
  createdAt: r.created_at,
});

// multipart/form-data: file field "file", optional text fields "alt" and "caption"
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw badRequest('Attach an image in the "file" field');
  const { alt, caption } = meta.parse(req.body ?? {});

  const result = await uploadImage(req.file.buffer);
  try {
    const { rows } = await query(
      `INSERT INTO media (cloudinary_id, url, width, height, bytes, format, alt, caption, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [result.public_id, result.secure_url, result.width, result.height, result.bytes, result.format, alt ?? null, caption ?? null, req.auth.id],
    );
    res.status(201).json({ data: shape(rows[0]) });
  } catch (err) {
    await destroyImage(result.public_id).catch(() => {}); // don't leave an orphan on Cloudinary
    throw err;
  }
});

router.get('/', validate({ query: z.object(paginationShape) }), async (req, res) => {
  const { page, limit } = req.valid.query;
  const [rows, total] = await Promise.all([
    query('SELECT * FROM media ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offsetOf({ page, limit })]),
    query('SELECT count(*)::int AS n FROM media'),
  ]);
  res.json({ data: rows.rows.map(shape), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

router.patch('/:id', allow('admin', 'editor'), validate({ params: idParams, body: meta }), async (req, res) => {
  const { alt, caption } = req.valid.body;
  const { rows } = await query(
    'UPDATE media SET alt = COALESCE($2, alt), caption = COALESCE($3, caption) WHERE id = $1 RETURNING *',
    [req.valid.params.id, alt ?? null, caption ?? null],
  );
  if (!rows[0]) throw notFound('Image');
  res.json({ data: shape(rows[0]) });
});

router.delete('/:id', allow('admin', 'editor'), validate({ params: idParams }), async (req, res) => {
  let row;
  try {
    ({
      rows: [row],
    } = await query('DELETE FROM media WHERE id = $1 RETURNING cloudinary_id', [req.valid.params.id]));
  } catch (err) {
    if (err.code === '23503') throw conflict('This image is used by a photo card. Change the photo card first.');
    throw err;
  }
  if (!row) throw notFound('Image');
  await destroyImage(row.cloudinary_id).catch((err) => console.error('[media] Cloudinary delete failed:', err.message));
  res.status(204).end();
});

export default router;
