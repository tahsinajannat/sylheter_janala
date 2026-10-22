import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { LANG_META } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { I18nProvider } from '@/lib/i18n/provider';
import { getLang, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { SiteFooter, SiteHeader, buildNavItems } from '@/modules/layout';
import '../globals.css';

export const viewport: Viewport = { themeColor: '#2e3047' };

export async function generateMetadata({ params }: { params: LangParams }): Promise<Metadata> {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    ...buildMetadata({ lang, title: t.site.name, description: t.site.description }),
    title: { default: `${t.site.name} - ${t.site.tagline}`, template: `%s | ${t.site.name}` },
    applicationName: t.site.name,
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: LangParams }) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const [categories, settings] = await Promise.all([api.taxonomy.categories(lang).catch(() => []), api.taxonomy.settings().catch(() => ({}) as Record<string, string>)]);

  const social = Object.entries(settings)
    .filter(([k, v]) => k.startsWith('social_') && /^https?:\/\//.test(v))
    .map(([k, href]) => ({ label: k.replace('social_', '').replace(/^./, (c) => c.toUpperCase()), href }));

  return (
    <html lang={lang} dir={LANG_META[lang].dir}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider lang={lang} dictionary={t}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3">
            {t.nav.skip}
          </a>
          <Suspense fallback={<div className="h-28 border-b" />}>
            <SiteHeader lang={lang} t={t} />
          </Suspense>
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter lang={lang} t={t} items={buildNavItems(lang, t, categories)} social={social} />
        </I18nProvider>
      </body>
    </html>
  );
}
