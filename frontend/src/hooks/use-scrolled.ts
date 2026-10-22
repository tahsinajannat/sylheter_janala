'use client';

import { useEffect, useState } from 'react';

/** True once the page is scrolled past `offset` px (with hysteresis so the navbar doesn't flicker). */
export function useScrolled(offset = 80) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled((prev) => (prev ? window.scrollY > offset - 30 : window.scrollY > offset));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);
  return scrolled;
}
