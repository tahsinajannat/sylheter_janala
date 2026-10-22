export type Lang = 'bn' | 'en';
export type Role = 'admin' | 'editor' | 'author';
export type Status = 'draft' | 'scheduled' | 'published' | 'archived';
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface Staff {
  id: string;
  name: string;
  email: string;
  kind: 'staff';
  role: Role;
}
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paged<T, M = unknown> {
  data: T[];
  meta: PageMeta & M;
}

export interface PostRow {
  id: string;
  lang: Lang;
  type: 'news' | 'editorial';
  slug: string;
  title: string;
  status: Status;
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  isHero: boolean;
  isSpotlight: boolean;
  isFeatured: boolean;
  categoryName: string;
  authorName: string;
}
export interface Post {
  id: string;
  lang: Lang;
  type: 'news' | 'editorial';
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: Status;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  categoryId: string;
  authorId: string;
  authorName: string;
  isHero: boolean;
  isSpotlight: boolean;
  spotlightOrder: number;
  isFeatured: boolean;
  featuredOrder: number;
  translationKey: string | null;
  viewCount: number;
  readMinutes: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  tagIds: string[];
}
export interface PhotoCard {
  id: string;
  lang: Lang;
  slug: string;
  title: string;
  caption: string | null;
  photographer: string | null;
  status: Status;
  imageId: string;
  imageUrl: string;
  categoryId: string | null;
  isSlider: boolean;
  sliderOrder: number;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  tagIds: string[];
}
export interface Video {
  id: string;
  lang: Lang;
  slug: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  status: Status;
  thumbnailId: string | null;
  thumbnailUrl?: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
}
export interface Media {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  alt: string | null;
  caption: string | null;
  createdAt: string;
}
export interface Category {
  id: string;
  lang: Lang;
  slug: string;
  name: string;
  sortOrder: number;
  showInNav: boolean;
  translationKey: string | null;
  posts: number;
}
export interface Tag {
  id: string;
  lang: Lang;
  slug: string;
  name: string;
}
export interface AdminComment {
  id: string;
  body: string;
  status: CommentStatus;
  parentId: string | null;
  createdAt: string;
  post: { id: string; title: string; lang: Lang };
  reader: { id: string; name: string; email: string };
}
export interface Subscriber {
  id: string;
  email: string;
  lang: Lang;
  status: 'pending' | 'active' | 'unsubscribed' | 'bounced';
  source: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}
export interface Campaign {
  id: string;
  lang: Lang;
  subject: string;
  bodyHtml: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
  stats?: Record<string, number>;
}
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}
export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}
export interface Stats {
  posts: Partial<Record<Status, number>>;
  photoCards: Partial<Record<Status, number>>;
  videos: Partial<Record<Status, number>>;
  views: { today: number; week: number; month: number };
  viewsByDay: { day: string; views: number }[];
  topPosts: { id: string; title: string; lang: Lang; views: number }[];
  pendingComments: number;
  subscribers: Partial<Record<'pending' | 'active' | 'unsubscribed' | 'bounced', number>>;
  recentPosts: { id: string; title: string; lang: Lang; status: Status; updatedAt: string; authorName: string }[];
}

export type AdKind = 'banner' | 'adsense';
export type AdPlacement = 'home_mid' | 'home_sidebar' | 'article_inline' | 'article_bottom' | 'listing_top';
export interface AdRow {
  id: string;
  name: string;
  kind: AdKind;
  placement: AdPlacement;
  lang: Lang | null;
  imageId: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  adsenseSlot: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  updatedAt: string;
}
