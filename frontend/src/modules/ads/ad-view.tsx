'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { API_BASE_URL, api } from '@/lib/api';
import type { Ad } from '@/lib/api/types';
import { useI18n } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Counts one impression per browser session, once at least half of the ad has been on screen. */
function useImpression(id: string, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const key = `ad:seen:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* storage blocked: count anyway */
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        try {
          sessionStorage.setItem(key, '1');
        } catch {
          /* ignore */
        }
        void api.ads.impression(id).catch(() => {});
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, enabled]);
  return ref;
}

/** Fire-and-forget; survives the page navigating away. */
function trackClick(id: string) {
  const url = `${API_BASE_URL}/ads/${id}/click`;
  try {
    if (navigator.sendBeacon(url)) return;
  } catch {
    /* fall through */
  }
  void fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
}

function Banner({ ad }: { ad: Ad }) {
  const ref = useImpression(ad.id, true);
  if (!ad.imageUrl || !ad.linkUrl) return null;
  return (
    <div ref={ref}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackClick(ad.id)}
        onAuxClick={() => trackClick(ad.id)}
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.imageUrl}
          alt={ad.alt}
          width={ad.imageWidth ?? undefined}
          height={ad.imageHeight ?? undefined}
          loading="lazy"
          className="mx-auto h-auto max-h-96 w-auto max-w-full"
        />
      </a>
    </div>
  );
}

function AdSense({ slot, client }: { slot: string; client: string }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    // Push once per element: React strict mode runs effects twice in development.
    if (ref.current?.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked by an ad blocker or not loaded yet */
    }
  }, []);
  return (
    <>
      <Script
        id="adsense-loader"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      />
      <ins ref={ref} className="adsbygoogle block" style={{ display: 'block' }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </>
  );
}

/** One ad with its "Advertisement" label. Banners report impressions and clicks to the API. */
export function AdView({ ad, className }: { ad: Ad; className?: string }) {
  const { t } = useI18n();
  const body =
    ad.kind === 'banner' ? (ad.imageUrl && ad.linkUrl ? <Banner ad={ad} /> : null) : ad.adsenseSlot && ad.adsenseClient ? <AdSense slot={ad.adsenseSlot} client={ad.adsenseClient} /> : null;
  if (!body) return null;
  return (
    <aside aria-label={t.ads.label} className={cn('text-center', className)}>
      <p className="mb-1 text-[11px] tracking-wider text-muted-foreground uppercase">{t.ads.label}</p>
      {body}
    </aside>
  );
}
