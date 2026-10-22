import { apiRequest } from '../client';
import type { Category, Lang, TagWithCount } from '../types';

export const taxonomy = {
  categories: (lang: Lang) => apiRequest<Category[]>('/categories', { query: { lang }, revalidate: 300, tags: ['categories'] }).then((r) => r.data),
  tags: (lang: Lang) => apiRequest<TagWithCount[]>('/tags', { query: { lang }, revalidate: 300, tags: ['tags'] }).then((r) => r.data),
  settings: () => apiRequest<Record<string, string>>('/settings', { revalidate: 300, tags: ['settings'] }).then((r) => r.data),
};
