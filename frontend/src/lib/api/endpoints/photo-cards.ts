import { apiRequest } from '../client';
import type { Lang, PageMeta, PhotoCard, PhotoCardDetail } from '../types';

export const photoCards = {
  list: (p: { lang: Lang; slider?: boolean; page?: number; limit?: number }) =>
    apiRequest<PhotoCard[], PageMeta>('/photo-cards', { query: { ...p, slider: p.slider ? 'true' : undefined }, tags: ['photo-cards'] }),

  get: (slug: string, lang: Lang) =>
    apiRequest<PhotoCardDetail>(`/photo-cards/${encodeURIComponent(slug)}`, { query: { lang }, tags: ['photo-cards'] }).then((r) => r.data),

  view: (id: string) => apiRequest<void>(`/photo-cards/${id}/view`, { method: 'POST' }),
};
