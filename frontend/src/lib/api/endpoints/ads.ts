import { apiRequest } from '../client';
import type { Ad, Lang } from '../types';

export const ads = {
  /** Every ad that may be shown right now for this language (called from the browser; the API never caches it). */
  list: (lang: Lang) => apiRequest<Ad[]>('/ads', { query: { lang } }).then((r) => r.data),

  impression: (id: string) => apiRequest<void>(`/ads/${id}/impression`, { method: 'POST' }),
};
