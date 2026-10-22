'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from './language-switcher';
import type { NavItem } from './nav-items';

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.nav.menu}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" closeLabel={t.common.close}>
        <SheetHeader>
          <SheetTitle>{t.nav.menu}</SheetTitle>
          <SheetDescription className="sr-only">{t.nav.sections}</SheetDescription>
        </SheetHeader>
        <nav className="-mx-2 flex flex-1 flex-col overflow-y-auto">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent">
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <LanguageSwitcher className="self-start" />
      </SheetContent>
    </Sheet>
  );
}
