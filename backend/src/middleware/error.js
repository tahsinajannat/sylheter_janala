import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, _res, next) => next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));

// Postgres error codes we can explain to the client.
const PG_ERRORS = {
  '23505': [409, 'A record with the same unique value already exists'],
  '23503': [409, 'This record is referenced by (or refers to) another record that does not exist'],
  '23514': [400, 'A value is outside the allowed range'],
  '23502': [400, 'A required value is missing'],
  '22P02': [400, 'Invalid value format'],
  '22001': [400, 'A value is too long'],
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let message = 'Internal server error';
  let details;

  if (err instanceof HttpError) {
    ({ status, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File is too large (max 10 MB)';
  } else if (err?.name === 'MulterError') {
    status = 400;
    message = err.message;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err?.code && PG_ERRORS[err.code]) {
    [status, message] = PG_ERRORS[err.code];
    if (err.code === '23505' && err.constraint) details = { constraint: err.constraint };
  } else if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500) {
    status = err.status;
    message = err.message;
  }

  if (status >= 500) {
    if (err instanceof HttpError) {
      // Expected, explained conditions (e.g. uploads not configured): one line, no stack.
      console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${status} ${message}`);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}`, err);
      details = env.isProd ? undefined : { stack: err?.stack };
    }
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}
