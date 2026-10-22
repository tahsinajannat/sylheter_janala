'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

/** Counts one view per browser session (the API also feeds the "most popular" ranking). Renders nothing. */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `viewed:post:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage blocked: count anyway */
    }
    void api.posts.view(postId).catch(() => {});
  }, [postId]);
  return null;
}
