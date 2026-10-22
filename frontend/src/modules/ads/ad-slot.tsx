import { api } from '@/lib/api';
import type { AdPlacement, Lang } from '@/lib/api/types';
import { AdView } from './ad-view';

/**
 * Server component: renders one ad for a placement, or nothing.
 * Direct banners win (a random one when several compete); AdSense fills the slot only when no banner is live.
 * A failing ads API never breaks the page.
 */
export async function AdSlot({ lang, placement, className }: { lang: Lang; placement: AdPlacement; className?: string }) {
  const [ads, settings] = await Promise.all([api.ads.list(lang).catch(() => []), api.taxonomy.settings().catch(() => ({}) as Record<string, string>)]);
  const adsenseClient = /^ca-pub-\d+$/.test(settings.site_adsense_client ?? '') ? settings.site_adsense_client : undefined;

  const here = ads.filter((a) => a.placement === placement);
  const banners = here.filter((a) => a.kind === 'banner');
  const adsense = adsenseClient ? here.filter((a) => a.kind === 'adsense') : [];
  const pool = banners.length > 0 ? banners : adsense;
  if (pool.length === 0) return null;

  const ad = pool[Math.floor(Math.random() * pool.length)]!;
  return <AdView ad={ad} adsenseClient={adsenseClient} className={className} />;
}
