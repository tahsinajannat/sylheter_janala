/**
 * Essential seed: data every environment needs (including production).
 * Idempotent - safe to run on every deploy. Never overwrites existing rows.
 *
 *   - site settings (portal URLs)
 *   - first admin account (ADMIN_EMAIL / ADMIN_PASSWORD)
 *   - bn/en category pairs
 */
import { env } from '../../config/env.js';
import { hashPassword } from '../../services/passwords.js';
import { deterministicUuid } from '../../utils/uuid.js';

export const CATEGORIES = [
  // slug, bn, en
  ['sylhet', 'সিলেট', 'Sylhet'],
  ['bangladesh', 'বাংলাদেশ', 'Bangladesh'],
  ['world', 'বিশ্ব', 'World'],
  ['economy', 'অর্থনীতি', 'Economy'],
  ['sports', 'খেলা', 'Sports'],
  ['entertainment', 'বিনোদন', 'Entertainment'],
  ['education', 'শিক্ষা', 'Education'],
  ['technology', 'প্রযুক্তি', 'Technology'],
  ['opinion', 'মতামত', 'Opinion'],
];

const DEV_ADMIN_PASSWORD = 'Admin@12345';

export async function seedEssential(db, log = console.log) {
  // --- settings ---
  const settings = [
    ['bn_portal_url', `${env.APP_URL}/bn`],
    ['en_portal_url', `${env.APP_URL}/en`],
    ['site_name_bn', 'সিলেটের জানালা'],
    ['site_name_en', 'Sylheter Janala'],
  ];
  for (const [key, value] of settings) {
    await db.query('INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
  }
  log('  settings ok');

  // --- admin ---
  const email = env.ADMIN_EMAIL.toLowerCase();
  const { rowCount: adminExists } = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (adminExists === 0) {
    let password = env.ADMIN_PASSWORD;
    if (!password) {
      if (env.isProd) throw new Error('ADMIN_PASSWORD must be set to create the first admin in production');
      password = DEV_ADMIN_PASSWORD;
    }
    await db.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`, [
      env.ADMIN_NAME,
      email,
      await hashPassword(password),
    ]);
    log(`  admin created: ${email}${env.ADMIN_PASSWORD ? '' : `  (dev password: ${DEV_ADMIN_PASSWORD} - change it!)`}`);
  } else {
    log(`  admin exists: ${email}`);
  }

  // --- categories ---
  let order = 0;
  for (const [slug, bn, en] of CATEGORIES) {
    order += 1;
    const key = deterministicUuid(`category:${slug}`);
    for (const [lang, name] of [
      ['bn', bn],
      ['en', en],
    ]) {
      await db.query(
        `INSERT INTO categories (lang, slug, name, sort_order, translation_key)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (lang, slug) DO NOTHING`,
        [lang, slug, name, order, key],
      );
    }
  }
  log(`  categories ok (${CATEGORIES.length} x 2 languages)`);
}
