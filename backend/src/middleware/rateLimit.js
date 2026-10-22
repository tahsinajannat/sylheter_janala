import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test', // automated tests make many calls from one IP
    message: { error: { message } },
  });

const MIN = 60_000;

export const globalLimiter = make(MIN, 300, 'Too many requests, slow down');
export const authLimiter = make(15 * MIN, 20, 'Too many login attempts, try again later');
export const subscribeLimiter = make(60 * MIN, 10, 'Too many subscription attempts, try again later');
export const writeLimiter = make(MIN, 20, 'You are doing that too fast');
export const counterLimiter = make(MIN, 120, 'Too many requests');
