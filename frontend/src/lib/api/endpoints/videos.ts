import { apiRequest } from '../client';
import type { Lang, PageMeta, Video, VideoDetail } from '../types';

export const videos = {
  list: (p: { lang: Lang; page?: number; limit?: number }) =>
    apiRequest<Video[], PageMeta>('/videos', { query: { ...p }, tags: ['videos'] }),

  get: (slug: string, lang: Lang) =>
    apiRequest<VideoDetail>(`/videos/${encodeURIComponent(slug)}`, { query: { lang }, tags: ['videos'] }).then((r) => r.data),

  view: (id: string) => apiRequest<void>(`/videos/${id}/view`, { method: 'POST' }),
};
