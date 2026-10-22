import { Router } from 'express';
import { allow, requireStaff } from '../../middleware/auth.js';
import comments from './comments.js';
import media from './media.js';
import photoCards from './photoCards.js';
import posts from './posts.js';
import settings from './settings.js';
import stats from './stats.js';
import { newsletters, subscribers } from './subscribers.js';
import { categories, tags } from './taxonomy.js';
import users from './users.js';
import videos from './videos.js';

/**
 * Staff API  (every route needs a staff token)
 *
 *   author  - write own drafts (posts, photos, videos), upload images, create tags
 *   editor  - everything content: publish, categories, comments, subscribers, newsletters
 *   admin   - everything, plus staff accounts and site settings
 */
const router = Router();
router.use(requireStaff());

const editors = allow('admin', 'editor');
const admins = allow('admin');

router.use('/stats', stats);
router.use('/posts', posts);
router.use('/photo-cards', photoCards);
router.use('/videos', videos);
router.use('/media', media);
router.use('/categories', categories);
router.use('/tags', tags);

router.use('/comments', editors, comments);
router.use('/subscribers', editors, subscribers);
router.use('/newsletters', editors, newsletters);

router.use('/users', admins, users);
router.use('/settings', admins, settings);

export default router;
