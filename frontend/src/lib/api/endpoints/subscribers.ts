import { apiRequest } from '../client';
import type { Lang } from '../types';

export const subscribers = {
  subscribe: (body: { email: string; lang: Lang; source?: string }) =>
    apiRequest<{ status: string; message?: string }>('/subscribers', { method: 'POST', body }).then((r) => r.data),
  confirm: (token: string) =>
    apiRequest<{ status: string; lang: Lang }>('/subscribers/confirm', { method: 'POST', body: { token } }).then((r) => r.data),
  unsubscribe: (token: string) =>
    apiRequest<{ status: string; lang: Lang }>('/subscribers/unsubscribe', { method: 'POST', body: { token } }).then((r) => r.data),
};
