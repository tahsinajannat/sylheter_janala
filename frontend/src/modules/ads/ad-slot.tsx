'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Ad, AdPlacement, Lang } from '@/lib/api/types';
import { AdView } from './ad-view';

/** One request serves every slot on the page; it is reused for a few seconds, then asked again. */
const cache = new Map<Lang, { at: number; ads: Promise<Ad[]> }>();
function loadAds(lang: Lang) {
  const hit = cache.get(lang);
  if (hit && Date.now() - hit.at < 15_000) return hit.ads;
  const ads = api.ads.list(lang).catch(() => [] as Ad[]);
  cache.set(lang, { at: Date.now(), ads });
  return ads;
}

/** Direct banners win (a random one when several compete); AdSense fills the slot only when no banner is live. */
function pick(ads: Ad[], placement: AdPlacement) {
  const here = ads.filter((a) => a.placement === placement);
  const banners = here.filter((a) => a.kind === 'banner');
  const pool = banners.length > 0 ? banners : here;
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]! : null;
}

/**
 * Renders one ad for a placement, or nothing. The list is fetched in the browser on every page view, not baked
 * into cached pages, so start and end times apply exactly and an ended ad never lingers. A failing ads API never
 * breaks the page.
 */
export function AdSlot({ lang, placement, className }: { lang: Lang; placement: AdPlacement; className?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  useEffect(() => {
    let alive = true;
    void loadAds(lang).then((ads) => alive && setAd(pick(ads, placement)));
    return () => {
      alive = false;
    };
  }, [lang, placement]);
  return ad ? <AdView ad={ad} className={className} /> : null;
}
