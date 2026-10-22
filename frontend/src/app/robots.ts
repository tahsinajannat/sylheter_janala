import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/bn/search', '/en/search', '/bn/bookmarks', '/en/bookmarks'] }, host: SITE_URL };
}
