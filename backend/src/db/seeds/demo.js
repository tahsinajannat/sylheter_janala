/**
 * Demo seed: sample content so the frontend has something to render.
 * Development only. Idempotent (re-running adds nothing new).
 *
 * Images are picsum.photos placeholders and YouTube ids are placeholders -
 * replace everything from the admin panel before launch.
 */
import { env } from '../../config/env.js';
import { hashPassword } from '../../services/passwords.js';
import { readMinutes } from '../../utils/html.js';
import { deterministicUuid } from '../../utils/uuid.js';

// slug, category, bn title, en title, bn excerpt, en excerpt, placement, tags
const STORIES = [
  {
    slug: 'surma-river-bank-protection',
    cat: 'sylhet',
    bn: ['সুরমা নদীর তীর সংরক্ষণে নতুন প্রকল্প', 'নদীভাঙন ঠেকাতে সিলেট নগরীর কয়েকটি এলাকায় নতুন প্রকল্পের কাজ শুরু হয়েছে।'],
    en: ['New project to protect the banks of the Surma river', 'Work has begun on a new project to stop riverbank erosion in several parts of Sylhet city.'],
    hero: true,
    spotlight: 1,
    tags: ['sylhet', 'nature'],
  },
  {
    slug: 'jaflong-tourist-rush',
    cat: 'sylhet',
    bn: ['জাফলংয়ে পর্যটকের ভিড়, বাড়ছে স্থানীয়দের আয়', 'ছুটির দিনগুলোতে জাফলংয়ে দেশি-বিদেশি পর্যটকের ঢল নেমেছে।'],
    en: ['Tourists flock to Jaflong, boosting local incomes', 'Domestic and foreign visitors are arriving in large numbers at Jaflong on holidays.'],
    spotlight: 2,
    tags: ['tourism', 'sylhet', 'nature'],
  },
  {
    slug: 'tea-garden-wage-talks',
    cat: 'sylhet',
    bn: ['চা শ্রমিকদের মজুরি নিয়ে নতুন আলোচনা', 'সিলেট অঞ্চলের চা বাগানের শ্রমিকদের মজুরি নিয়ে মালিক ও শ্রমিক প্রতিনিধিরা বৈঠকে বসছেন।'],
    en: ["Fresh talks on tea garden workers' wages", 'Owners and worker representatives are meeting over wages in the Sylhet tea belt.'],
    spotlight: 3,
    tags: ['economy', 'sylhet'],
  },
  {
    slug: 'sylhet-stadium-match-preparation',
    cat: 'sports',
    bn: ['সিলেট স্টেডিয়ামে আন্তর্জাতিক ম্যাচের প্রস্তুতি', 'আসন্ন আন্তর্জাতিক ম্যাচকে সামনে রেখে স্টেডিয়ামে চলছে শেষ মুহূর্তের প্রস্তুতি।'],
    en: ['Preparations under way for international match at Sylhet stadium', 'Final preparations are in progress at the stadium ahead of the upcoming international fixture.'],
    spotlight: 4,
    tags: ['sylhet'],
  },
  {
    slug: 'new-textbooks-distribution',
    cat: 'education',
    bn: ['নতুন শিক্ষাবর্ষের বই বিতরণ শুরু', 'দেশজুড়ে প্রাথমিক ও মাধ্যমিক স্তরে বিনামূল্যের পাঠ্যবই বিতরণ শুরু হয়েছে।'],
    en: ['Distribution of new academic-year textbooks begins', 'Free textbooks for primary and secondary students are being handed out across the country.'],
    featured: 1,
    tags: [],
  },
  {
    slug: 'remittance-record',
    cat: 'economy',
    bn: ['প্রবাসীদের পাঠানো রেমিট্যান্সে নতুন রেকর্ড', 'সিলেট অঞ্চলের প্রবাসীদের পাঠানো রেমিট্যান্স আগের সব রেকর্ড ছাড়িয়েছে।'],
    en: ['Remittances from expatriates hit a new record', 'Money sent home by expatriates from the Sylhet region has surpassed all previous records.'],
    featured: 2,
    tags: ['economy', 'sylhet'],
  },
  {
    slug: 'youth-startup-fair',
    cat: 'technology',
    bn: ['সিলেটে তরুণদের স্টার্টআপ মেলা অনুষ্ঠিত', 'দুই দিনের মেলায় অর্ধশতাধিক স্টার্টআপ তাদের উদ্ভাবন তুলে ধরেছে।'],
    en: null,
    featured: 3,
    tags: ['sylhet'],
  },
  {
    slug: 'hason-raja-music-evening',
    cat: 'entertainment',
    bn: ['হাছন রাজা স্মরণে সংগীত সন্ধ্যা', 'মরমি কবি হাছন রাজার স্মরণে সিলেটে আয়োজিত হয়েছে সংগীত সন্ধ্যা।'],
    en: null,
    featured: 4,
    tags: ['sylhet'],
  },
  {
    slug: 'climate-summit-position',
    cat: 'world',
    bn: ['বৈশ্বিক জলবায়ু সম্মেলনে বাংলাদেশের অবস্থান', 'জলবায়ু অর্থায়ন নিয়ে সম্মেলনে বাংলাদেশ তার দাবি জোরালোভাবে তুলে ধরেছে।'],
    en: null,
    tags: [],
  },
  {
    slug: 'university-research-fair',
    cat: 'education',
    bn: ['বিশ্ববিদ্যালয়ে গবেষণা মেলা', 'শিক্ষার্থীদের উদ্ভাবনী গবেষণা নিয়ে আয়োজিত হয়েছে তিন দিনের গবেষণা মেলা।'],
    en: null,
    tags: [],
  },
];

const EDITORIALS = [
  {
    slug: 'flood-preparedness-priority',
    bn: ['বন্যা মোকাবিলায় আগাম প্রস্তুতিই হোক অগ্রাধিকার', 'প্রতি বছর বন্যার ক্ষতি কমাতে আগাম প্রস্তুতির বিকল্প নেই।'],
    en: ['Flood preparedness must be the priority', 'There is no substitute for early preparation if we want to cut flood losses every year.'],
  },
  {
    slug: 'protecting-sylhet-heritage',
    bn: ['ঐতিহ্য রক্ষায় সিলেটের দায়িত্ব', 'মাজার, স্থাপনা ও লোকসংস্কৃতি রক্ষায় সম্মিলিত উদ্যোগ জরুরি।'],
    en: ["Sylhet's duty to protect its heritage", 'Shrines, buildings and folk culture all need collective protection.'],
  },
];

const TAGS = [
  ['sylhet', 'সিলেট', 'Sylhet'],
  ['tourism', 'পর্যটন', 'Tourism'],
  ['nature', 'প্রকৃতি', 'Nature'],
  ['economy', 'অর্থনীতি', 'Economy'],
];

const PHOTOS = [
  ['surma-evening', 'সুরমার সন্ধ্যা', 'Evening on the Surma', 'সন্ধ্যার আলোয় সুরমা নদী।', 'The Surma river in evening light.'],
  ['jaflong-stones', 'জাফলংয়ের পাথর', 'Stones of Jaflong', 'পিয়াইন নদীর বুকে পাথরের স্তূপ।', 'Stones piled along the Piyain river.'],
  ['tea-dawn', 'চা বাগানের ভোর', 'Dawn in the tea gardens', 'কুয়াশায় ঢাকা চা বাগান।', 'Tea gardens wrapped in morning mist.'],
  ['ratargul', 'রাতারগুল জলাবন', 'Ratargul swamp forest', 'বর্ষায় ডুবে থাকা জলাবন।', 'The swamp forest submerged in the monsoon.'],
  ['lalakhal', 'লালাখালের নীল জল', 'Blue waters of Lalakhal', 'স্বচ্ছ নীল জলের লালাখাল।', 'The clear blue water of Lalakhal.'],
  ['hakaluki', 'হাকালুকি হাওর', 'Hakaluki Haor', 'বিস্তীর্ণ হাওরে পাখির মেলা।', 'Birds gathering across the wide haor.'],
];

// Placeholder YouTube ids - replace with your channel's videos.
const VIDEOS = [
  ['tea-garden-glimpse', 'jNQXAC9IVRw', 'সিলেটের চা বাগান: এক ঝলক', 'A glimpse of Sylhet’s tea gardens'],
  ['jaflong-travel-guide', '9bZkp7q19f0', 'জাফলং ভ্রমণ গাইড', 'Jaflong travel guide'],
  ['sylhet-food', 'kJQP7kiw5Fk', 'সিলেটের ঐতিহ্যবাহী খাবার', 'Traditional food of Sylhet'],
  ['haor-in-monsoon', 'OPf0YbXqDm0', 'বর্ষায় হাওরের রূপ', 'The haor in the monsoon'],
];

const bodyHtml = (lang, excerpt) =>
  lang === 'bn'
    ? `<p>${excerpt}</p><p>এটি একটি ডেমো সংবাদ। প্রকৃত বিষয়বস্তু প্রকাশের আগে অ্যাডমিন প্যানেল থেকে এটি সম্পাদনা বা মুছে ফেলুন।</p><p>সিলেট অঞ্চলের মানুষের জীবন, সংস্কৃতি ও অর্থনীতি নিয়ে নিয়মিত সংবাদ পাবেন সিলেটের জানালায়।</p>`
    : `<p>${excerpt}</p><p>This is demo content. Edit or delete it from the admin panel before publishing real stories.</p><p>Sylheter Janala brings regular coverage of life, culture and the economy in the Sylhet region.</p>`;

export async function seedDemo(db, log = console.log) {
  if (env.isProd) throw new Error('Demo seed is for development only (NODE_ENV=production)');

  // ---- staff + reader ----
  const { rows: admins } = await db.query('SELECT id FROM users WHERE email = $1', [env.ADMIN_EMAIL.toLowerCase()]);
  if (!admins[0]) throw new Error('Admin user missing - run the essential seed first');
  const authorId = admins[0].id;

  const devStaff = [
    ['Demo Editor', 'editor@sylheterjanala.local', 'editor'],
    ['Demo Author', 'author@sylheterjanala.local', 'author'],
  ];
  const staffHash = await hashPassword('Staff@12345', 10);
  for (const [name, email, role] of devStaff) {
    await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      [name, email, staffHash, role],
    );
  }
  const readerHash = await hashPassword('Reader@12345', 10);
  const { rows: readers } = await db.query(
    `INSERT INTO readers (name, email, password_hash, email_verified_at)
     VALUES ('Demo Reader', 'reader@example.com', $1, now())
     ON CONFLICT (email) DO UPDATE SET name = readers.name RETURNING id`,
    [readerHash],
  );
  const readerId = readers[0].id;
  log('  demo staff + reader ok');

  // ---- helpers ----
  const categoryId = async (lang, slug) =>
    (await db.query('SELECT id FROM categories WHERE lang = $1 AND slug = $2', [lang, slug])).rows[0].id;

  const media = async (cloudinaryId, w, h) =>
    (
      await db.query(
        `INSERT INTO media (cloudinary_id, url, width, height, bytes, format, alt)
         VALUES ($1, $2, $3, $4, 150000, 'jpg', 'Demo image')
         ON CONFLICT (cloudinary_id) DO UPDATE SET url = EXCLUDED.url RETURNING id`,
        [cloudinaryId, `https://picsum.photos/seed/${cloudinaryId}/${w}/${h}`, w, h],
      )
    ).rows[0].id;

  // ---- tags ----
  const tagIds = {}; // `${lang}:${slug}` -> id
  for (const [slug, bn, en] of TAGS) {
    for (const [lang, name] of [['bn', bn], ['en', en]]) {
      const { rows } = await db.query(
        `INSERT INTO tags (lang, slug, name) VALUES ($1, $2, $3)
         ON CONFLICT (lang, slug) DO UPDATE SET name = tags.name RETURNING id`,
        [lang, slug, name],
      );
      tagIds[`${lang}:${slug}`] = rows[0].id;
    }
  }

  // ---- posts (news + editorials) ----
  let index = 0;
  const postIds = [];
  const insertPost = async ({ lang, type, slug, cat, title, excerpt, imgKey, flags, tags, hoursAgo }) => {
    const content = bodyHtml(lang, excerpt);
    const { rows } = await db.query(
      `INSERT INTO posts (lang, type, slug, title, excerpt, content, status, featured_image_id, category_id, author_id,
                          is_hero, is_spotlight, spotlight_order, is_featured, featured_order,
                          translation_key, read_minutes, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,'published',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now() - make_interval(hours => $17))
       ON CONFLICT (lang, slug) DO NOTHING RETURNING id`,
      [
        lang, type, slug, title, excerpt, content,
        await media(imgKey, 1200, 675),
        await categoryId(lang, cat),
        authorId,
        Boolean(flags.hero), Boolean(flags.spotlight), flags.spotlight ?? 0,
        Boolean(flags.featured), flags.featured ?? 0,
        deterministicUuid(`post:${slug}`),
        readMinutes(content),
        hoursAgo,
      ],
    );
    const id = rows[0]?.id ?? (await db.query('SELECT id FROM posts WHERE lang=$1 AND slug=$2', [lang, slug])).rows[0].id;
    for (const t of tags) {
      await db.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagIds[`${lang}:${t}`]]);
    }
    postIds.push(id);
    return id;
  };

  const storyPostIds = {};
  for (const s of STORIES) {
    index += 1;
    for (const lang of ['bn', 'en']) {
      if (!s[lang]) continue;
      const [title, excerpt] = s[lang];
      storyPostIds[`${lang}:${s.slug}`] = await insertPost({
        lang, type: 'news', slug: s.slug, cat: s.cat, title, excerpt,
        imgKey: `post-${s.slug}`,
        flags: { hero: s.hero, spotlight: s.spotlight, featured: s.featured },
        tags: s.tags, hoursAgo: index * 5 + (lang === 'en' ? 1 : 0),
      });
    }
  }
  for (const e of EDITORIALS) {
    index += 1;
    for (const lang of ['bn', 'en']) {
      const [title, excerpt] = e[lang];
      await insertPost({
        lang, type: 'editorial', slug: e.slug, cat: 'opinion', title, excerpt,
        imgKey: `editorial-${e.slug}`, flags: {}, tags: [], hoursAgo: index * 5,
      });
    }
  }
  log(`  posts ok (${postIds.length})`);

  // ---- daily views -> "most popular" ----
  const total = new Map();
  for (const [i, id] of postIds.entries()) {
    for (let d = 0; d < 7; d += 1) {
      const views = ((i * 7 + d * 3 + (i % 3) * 11) % 40) + 1;
      await db.query(
        `INSERT INTO post_views_daily (post_id, day, views)
         VALUES ($1, (now() AT TIME ZONE $2::text)::date - $3::int, $4) ON CONFLICT DO NOTHING`,
        [id, env.SITE_TIMEZONE, d, views],
      );
      total.set(id, (total.get(id) ?? 0) + views);
    }
  }
  for (const [id, views] of total) {
    await db.query('UPDATE posts SET view_count = GREATEST(view_count, $2) WHERE id = $1', [id, views]);
  }

  // ---- photo cards ----
  let photoCount = 0;
  for (const [i, [slug, bnT, enT, bnC, enC]] of PHOTOS.entries()) {
    for (const [lang, title, caption] of [['bn', bnT, bnC], ['en', enT, enC]]) {
      if (lang === 'en' && i >= 4) continue;
      const { rows } = await db.query(
        `INSERT INTO photo_cards (lang, slug, title, caption, photographer, status, image_id, category_id, author_id,
                                  is_slider, slider_order, published_at)
         VALUES ($1,$2,$3,$4,'Demo Photographer','published',$5,$6,$7,true,$8, now() - make_interval(hours => $9))
         ON CONFLICT (lang, slug) DO NOTHING RETURNING id`,
        [lang, slug, title, caption, await media(`photo-${slug}`, 1200, 800), await categoryId(lang, 'sylhet'), authorId, i + 1, i * 3],
      );
      if (rows[0]) {
        photoCount += 1;
        for (const t of ['sylhet', 'nature']) {
          await db.query('INSERT INTO photo_card_tags (photo_card_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, tagIds[`${lang}:${t}`]]);
        }
      }
    }
  }
  log(`  photo cards ok (+${photoCount})`);

  // ---- videos ----
  let videoCount = 0;
  for (const [i, [slug, ytId, bnT, enT]] of VIDEOS.entries()) {
    for (const [lang, title] of [['bn', bnT], ['en', enT]]) {
      if (lang === 'en' && i >= 2) continue;
      const { rowCount } = await db.query(
        `INSERT INTO videos (lang, slug, title, description, youtube_url, youtube_id, status, category_id, author_id, is_featured, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,'published',$7,$8,$9, now() - make_interval(hours => $10))
         ON CONFLICT (lang, slug) DO NOTHING`,
        [lang, slug, title, 'Demo video - replace with your own.', `https://www.youtube.com/watch?v=${ytId}`, ytId, await categoryId(lang, 'sylhet'), authorId, i === 0, i * 6],
      );
      videoCount += rowCount;
    }
  }
  log(`  videos ok (+${videoCount})`);

  // ---- comments + subscribers ----
  const firstPost = storyPostIds['bn:surma-river-bank-protection'];
  const { rowCount: hasComments } = await db.query('SELECT 1 FROM comments WHERE post_id = $1', [firstPost]);
  if (hasComments === 0) {
    await db.query(
      `INSERT INTO comments (post_id, reader_id, body, status) VALUES
       ($1, $2, 'খুব প্রয়োজনীয় একটি উদ্যোগ, ধন্যবাদ।', 'approved'),
       ($1, $2, 'কাজের অগ্রগতি নিয়মিত জানালে ভালো হয়।', 'approved'),
       ($1, $2, 'এই মন্তব্যটি মডারেশনের অপেক্ষায় আছে।', 'pending')`,
      [firstPost, readerId],
    );
  }
  for (const [email, lang, status] of [
    ['demo1@example.com', 'bn', 'active'],
    ['demo2@example.com', 'en', 'active'],
    ['demo3@example.com', 'bn', 'pending'],
  ]) {
    await db.query(
      `INSERT INTO subscribers (email, lang, status, confirmed_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [email, lang, status, status === 'active' ? new Date() : null],
    );
  }
  log('  comments + subscribers ok');
}
