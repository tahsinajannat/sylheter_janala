'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Lang } from '@/lib/api/types';

/**
 * Pages whose other-language URL is NOT just the same path with another prefix (a story has a different slug
 * in each language) render <SetAlternates paths={{ en: '/news/other-slug' }} />.
 * The language switcher reads it. Paths exclude the language prefix.
 */
type Paths = Partial<Record<Lang, string>>;
let current: Paths | null = null;
const listeners = new Set<() => void>();
const set = (p: Paths | null) => {
  current = p;
  listeners.forEach((l) => l());
};

export function SetAlternates({ paths }: { paths: Paths }) {
  const key = JSON.stringify(paths);
  useEffect(() => {
    set(JSON.parse(key));
    return () => set(null);
  }, [key]);
  return null;
}

export const useAlternates = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
