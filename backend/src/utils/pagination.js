import { z } from 'zod';

export const paginationShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

export const offsetOf = ({ page, limit }) => (page - 1) * limit;

export const pageMeta = (total, { page, limit }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
