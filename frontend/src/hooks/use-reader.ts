'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Reader } from '@/lib/api/types';

/**
 * Reader session, kept in localStorage.
 * Trade-off (documented in README): a token in localStorage is readable by any script on the page, so the site
 * must stay free of third-party scripts; the token only grants comment / bookmark access, never staff rights.
 * Moving it to an httpOnly cookie is a Route-Handler-proxy change that only touches this hook.
 */
const KEY = 'sj_reader';
interface Stored {
  token: string;
  reader: Reader;
}

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Stored | null } = { raw: null, value: null };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, value: raw ? (JSON.parse(raw) as Stored) : null };
  } catch {
    cache = { raw: null, value: null };
  }
  return cache.value;
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
};
const emit = () => listeners.forEach((l) => l());

export function useReader() {
  const session = useSyncExternalStore(subscribe, read, () => null);

  const signIn = useCallback((s: Stored) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable: session lasts until reload */
    }
    emit();
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  return { token: session?.token ?? null, reader: session?.reader ?? null, signIn, signOut };
}
