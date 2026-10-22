/** Plain helpers (no 'use client'), usable from both server and client components. */
import type { AdPlacement } from '@/lib/admin/types';

export const selectClass =
  'h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50';

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }) : '-';

// <input type="datetime-local"> has no time zone; the newsroom works in Dhaka time (UTC+6).
export const toDhakaInput = (iso: string | null | undefined) => (iso ? new Date(new Date(iso).getTime() + 6 * 3600_000).toISOString().slice(0, 16) : '');
export const fromDhakaInput = (v: string) => (v ? new Date(`${v}:00+06:00`).toISOString() : null);

export const PLACEMENTS: { value: AdPlacement; label: string; hint: string }[] = [
  { value: 'home_mid', label: 'Home page - between sections', hint: 'Wide banner under the featured stories. About 970x250.' },
  { value: 'home_sidebar', label: 'Home page - side column', hint: 'Beside the latest news, under the other-language box. About 300x250.' },
  { value: 'article_inline', label: 'Article - after the text', hint: 'Right after the story body. About 728x90 or 300x250.' },
  { value: 'article_bottom', label: 'Article - before comments', hint: 'Below related and popular stories. About 728x90.' },
  { value: 'listing_top', label: 'Listing pages - top', hint: 'Above the story grid on category, tag, search and news pages. About 970x90.' },
];
export const placementLabel = (p: AdPlacement) => PLACEMENTS.find((x) => x.value === p)?.label ?? p;
