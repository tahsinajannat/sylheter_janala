import type { Lang } from '@/lib/api/types';

/** All internal URLs are built here so a route rename is a one-file change. */
export const routes = {
  home: (l: Lang) => `/${l}`,
  news: (l: Lang, page?: number) => `/${l}/news${page && page > 1 ? `?page=${page}` : ''}`,
  post: (l: Lang, slug: string) => `/${l}/news/${encodeURIComponent(slug)}`,
  category: (l: Lang, slug: string) => `/${l}/category/${encodeURIComponent(slug)}`,
  tag: (l: Lang, slug: string) => `/${l}/tag/${encodeURIComponent(slug)}`,
  editorials: (l: Lang) => `/${l}/editorials`,
  search: (l: Lang, q?: string) => `/${l}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  photos: (l: Lang) => `/${l}/photo-cards`,
  photo: (l: Lang, slug: string) => `/${l}/photo-cards/${encodeURIComponent(slug)}`,
  videos: (l: Lang) => `/${l}/videos`,
  video: (l: Lang, slug: string) => `/${l}/videos/${encodeURIComponent(slug)}`,
  login: (l: Lang) => `/${l}/login`,
  register: (l: Lang) => `/${l}/register`,
  bookmarks: (l: Lang) => `/${l}/bookmarks`,
  subscribeConfirm: (l: Lang) => `/${l}/subscribe/confirm`,
  subscribeUnsubscribe: (l: Lang) => `/${l}/subscribe/unsubscribe`,
};
