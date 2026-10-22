import { apiRequest } from '../client';
import type { Ad, Lang } from '../types';

export const ads = {
  /** Every ad that may be shown now for this language; the site picks one per placement. */
  list: (lang: Lang) => apiRequest<Ad[]>('/ads', { query: { lang }, revalidate: 60, tags: ['ads'] }).then((r) => r.data),

  impression: (id: string) => apiRequest<void>(`/ads/${id}/impression`, { method: 'POST' }),
};
