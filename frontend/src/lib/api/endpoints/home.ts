import { apiRequest } from '../client';
import type { HomePayload, Lang } from '../types';

export const home = {
  get: (lang: Lang) => apiRequest<HomePayload>('/home', { query: { lang }, revalidate: 60, tags: ['home'] }).then((r) => r.data),
};
