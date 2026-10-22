/** Plain helpers (no 'use client'), usable from both server and client components. */

export const selectClass =
  'h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50';

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }) : '-';

// <input type="datetime-local"> has no time zone; the newsroom works in Dhaka time (UTC+6).
export const toDhakaInput = (iso: string | null | undefined) => (iso ? new Date(new Date(iso).getTime() + 6 * 3600_000).toISOString().slice(0, 16) : '');
export const fromDhakaInput = (v: string) => (v ? new Date(`${v}:00+06:00`).toISOString() : null);
