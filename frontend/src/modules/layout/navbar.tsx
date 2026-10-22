'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Container, Logo } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useScrolled } from '@/hooks/use-scrolled';
import { useI18n } from '@/lib/i18n/provider';
import { todayLabel } from '@/lib/i18n/format';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';
import type { NavItem } from './nav-items';
import { UserMenu } from './user-menu';

/**
 * Two states:
 *  - top of the page: utility bar (date, language, account) + tall logo + category row
 *  - scrolled:        utility bar collapses, logo shrinks and sits inline with the links in one compact bar
 */
export function Navbar({ items }: { items: NavItem[] }) {
  const { lang, t } = useI18n();
  const scrolled = useScrolled(80);
  const pathname = usePathname();

  // The header is fixed and a spacer reserves its expanded height, so collapsing it on scroll never
  // changes the document height (which used to shift scrollY and flip `scrolled` back and forth).
  const headerRef = useRef<HTMLElement>(null);
  const [expandedHeight, setExpandedHeight] = useState<number>();
  useEffect(() => {
    const el = headerRef.current;
    if (!el || scrolled) return;
    const measure = () => setExpandedHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrolled]);

  const isActive = (href: string) => (href === routes.home(lang) ? pathname === href : pathname.startsWith(href));

  const links = (
    <ul className="no-scrollbar flex items-center gap-1 overflow-x-auto">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:text-primary',
              isActive(item.href) && 'text-primary',
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div aria-hidden style={{ height: expandedHeight }} className={expandedHeight === undefined ? 'h-28 lg:h-44' : undefined} />
      <header
        ref={headerRef}
        className={cn('fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur transition-shadow', scrolled && 'shadow-md')}
      >
      {/* utility bar - collapses on scroll */}
      <div className={cn('grid transition-[grid-template-rows] duration-300', scrolled ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]')}>
        <div className="overflow-hidden">
          <Container className="flex h-9 items-center justify-between border-b text-xs text-muted-foreground">
            {/* ICU in Node and in the browser can format the same date slightly differently */}
            <span className="hidden sm:block" suppressHydrationWarning>
              {todayLabel(lang)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher className="hidden lg:inline-flex" />
              <UserMenu />
            </div>
          </Container>
        </div>
      </div>

      <Container className={cn('flex items-center gap-3 transition-all duration-300', scrolled ? 'h-14' : 'h-20 lg:h-24')}>
        <MobileMenu items={items} />
        <Logo lang={lang} compact={scrolled} />

        {/* scrolled: links share the row with the logo */}
        <nav aria-label={t.nav.sections} className={cn('hidden min-w-0 flex-1 justify-center lg:flex', !scrolled && 'lg:hidden')}>
          {links}
        </nav>
        <div className={cn('flex-1', scrolled && 'lg:hidden')} />

        <Button asChild variant="ghost" size="icon" aria-label={t.nav.search}>
          <Link href={routes.search(lang)}>
            <Search className="size-5" />
          </Link>
        </Button>
        {scrolled && <LanguageSwitcher className="hidden lg:inline-flex" />}
      </Container>

      {/* top: links get their own row under the logo */}
      <nav aria-label={t.nav.sections} className={cn('hidden border-t transition-all duration-300 lg:block', scrolled && 'lg:hidden')}>
        <Container className="flex justify-center">{links}</Container>
      </nav>
      </header>
    </>
  );
}
