import { Router } from 'express';
import { env } from '../config/env.js';
import adminRoutes from './admin/index.js';
import authRoutes from './auth.js';
import bookmarkRoutes from './bookmarks.js';
import docsRoutes from './docs.js';
import homeRoutes from './home.js';
import photoCardRoutes from './photoCards.js';
import postRoutes from './posts.js';
import subscriberRoutes from './subscribers.js';
import { categoriesRouter, settingsRouter, tagsRouter } from './taxonomy.js';
import videoRoutes from './videos.js';
import webhookRoutes from './webhooks.js';

const router = Router();

// docs (Swagger UI) - API_DOCS_ENABLED
if (env.API_DOCS_ENABLED) router.use('/docs', docsRoutes);

// public
router.use('/home', homeRoutes);
router.use('/posts', postRoutes);
router.use('/photo-cards', photoCardRoutes);
router.use('/videos', videoRoutes);
router.use('/categories', categoriesRouter);
router.use('/tags', tagsRouter);
router.use('/settings', settingsRouter);
router.use('/subscribers', subscriberRoutes);
router.use('/webhooks', webhookRoutes);

// accounts
router.use('/auth', authRoutes);
router.use('/bookmarks', bookmarkRoutes);

// staff
router.use('/admin', adminRoutes);

export default router;
