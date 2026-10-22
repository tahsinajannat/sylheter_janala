import 'dotenv/config';
import { z } from 'zod';

// Docker compose passes unset variables as empty strings - treat them as "not set".
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_SSL: z.string().optional(),
  DB_SSL_REJECT_UNAUTHORIZED: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  RUN_MIGRATIONS_ON_START: z.string().optional(),
  API_DOCS_ENABLED: z.string().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  SITE_TIMEZONE: z.string().default('Asia/Dhaka'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('সিলেটের জানালা <no-reply@localhost>'),
  EMAIL_WEBHOOK_SECRET: z.string().optional(),

  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().default('admin@sylheterjanala.local'),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const toBool = (v, fallback) => (v === undefined ? fallback : ['true', '1', 'yes'].includes(v.toLowerCase()));
const e = parsed.data;

export const env = {
  ...e,
  isProd: e.NODE_ENV === 'production',
  DB_SSL: toBool(e.DB_SSL, false),
  DB_SSL_REJECT_UNAUTHORIZED: toBool(e.DB_SSL_REJECT_UNAUTHORIZED, true),
  RUN_MIGRATIONS_ON_START: toBool(e.RUN_MIGRATIONS_ON_START, false),
  // Swagger UI: on by default except in production
  API_DOCS_ENABLED: toBool(e.API_DOCS_ENABLED, e.NODE_ENV !== 'production'),
  CORS_ORIGIN_LIST: e.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cloudinaryEnabled: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
  smtpEnabled: Boolean(e.SMTP_HOST),
};
