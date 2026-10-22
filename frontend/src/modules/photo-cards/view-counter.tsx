'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

/** Counts one photo-card view per browser session. Renders nothing. */
export function ViewCounter({ id }: { id: string }) {
  useEffect(() => {
    const key = `viewed:photo:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage blocked: count anyway */
    }
    void api.photoCards.view(id).catch(() => {});
  }, [id]);
  return null;
}
