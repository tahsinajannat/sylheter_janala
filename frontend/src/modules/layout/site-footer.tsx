import Link from 'next/link';
import { Container, Logo } from '@/components/common';
import { Separator } from '@/components/ui/separator';
import type { Lang } from '@/lib/api/types';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { SubscribeForm } from '@/modules/subscribe';
import type { NavItem } from './nav-items';

export function SiteFooter({ lang, t, items, social }: { lang: Lang; t: Dictionary; items: NavItem[]; social: { label: string; href: string }[] }) {
  return (
    <footer className="mt-16 bg-navy text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <div className="inline-block rounded-md bg-white p-3">
            <Logo lang={lang} />
          </div>
          <p className="max-w-sm text-sm text-white/75">{t.footer.about}</p>
        </div>

        <nav aria-label={t.footer.sections}>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/60 uppercase">{t.footer.sections}</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-primary-foreground hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          {social.length > 0 && (
            <>
              <h2 className="mt-6 mb-3 text-sm font-semibold tracking-wide text-white/60 uppercase">{t.footer.follow}</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {social.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <div>
          <h2 className="mb-1 text-lg font-semibold">{t.subscribe.title}</h2>
          <p className="mb-4 text-sm text-white/75">{t.subscribe.text}</p>
          <SubscribeForm source="footer" tone="dark" />
        </div>
      </Container>
      <Separator className="bg-white/15" />
      <Container className="py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {t.site.name}. {t.footer.rights}
      </Container>
    </footer>
  );
}
