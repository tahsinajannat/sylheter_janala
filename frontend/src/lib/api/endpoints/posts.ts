import { apiRequest } from '../client';
import type { Comment, Lang, PageMeta, PostCard, PostDetail } from '../types';

export interface PostListParams {
  lang: Lang;
  type?: 'news' | 'editorial';
  category?: string;
  tag?: string;
  q?: string;
  exclude?: string;
  page?: number;
  limit?: number;
}

export const posts = {
  list: (p: PostListParams) =>
    apiRequest<PostCard[], PageMeta>('/posts', { query: { ...p }, tags: ['posts'] }),

  popular: (lang: Lang, range: 'day' | 'week' | 'month' = 'week', limit = 5) =>
    apiRequest<PostCard[]>('/posts/popular', { query: { lang, range, limit }, revalidate: 300 }).then((r) => r.data),

  get: (slug: string, lang: Lang) =>
    apiRequest<PostDetail>(`/posts/${encodeURIComponent(slug)}`, { query: { lang }, tags: ['posts', `post:${slug}`] }).then((r) => r.data),

  view: (id: string) => apiRequest<void>(`/posts/${id}/view`, { method: 'POST' }),
  share: (id: string) => apiRequest<{ shareCount: number }>(`/posts/${id}/share`, { method: 'POST' }).then((r) => r.data),

  comments: (id: string) => apiRequest<Comment[]>(`/posts/${id}/comments`, { revalidate: false }).then((r) => r.data),
  addComment: (id: string, token: string, body: { body: string; parentId?: string }) =>
    apiRequest<{ id: string; status: string; message?: string }>(`/posts/${id}/comments`, { method: 'POST', token, body }).then((r) => r.data),
};
