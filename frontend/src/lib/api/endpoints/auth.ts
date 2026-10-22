import { apiRequest } from '../client';
import type { Lang, PageMeta, PostCard, ReaderSession } from '../types';

export const auth = {
  register: (body: { name: string; email: string; password: string; preferredLang?: Lang }) =>
    apiRequest<ReaderSession>('/auth/reader/register', { method: 'POST', body }).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    apiRequest<ReaderSession>('/auth/reader/login', { method: 'POST', body }).then((r) => r.data),
};

export const bookmarks = {
  list: (token: string, page = 1) => apiRequest<PostCard[], PageMeta>('/bookmarks', { token, query: { page, limit: 12 } }),
  add: (token: string, postId: string) => apiRequest<void>(`/bookmarks/${postId}`, { method: 'PUT', token }),
  remove: (token: string, postId: string) => apiRequest<void>(`/bookmarks/${postId}`, { method: 'DELETE', token }),
};
