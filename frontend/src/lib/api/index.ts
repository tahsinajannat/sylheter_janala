/** Public surface of the API layer: `import { api } from '@/lib/api'`. */
import { ads } from './endpoints/ads';
import { auth, bookmarks } from './endpoints/auth';
import { home } from './endpoints/home';
import { photoCards } from './endpoints/photo-cards';
import { posts } from './endpoints/posts';
import { subscribers } from './endpoints/subscribers';
import { taxonomy } from './endpoints/taxonomy';
import { videos } from './endpoints/videos';

export const api = { ads, home, posts, photoCards, videos, taxonomy, subscribers, auth, bookmarks };

export { apiRequest, API_BASE_URL } from './client';
export { ApiError } from './errors';
export type * from './types';
