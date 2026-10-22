'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Files,
  Film,
  FolderTree,
  Image as ImageIcon,
  ImagesIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  Settings,
  Users,
  Users2,
  ExternalLink,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { admin } from '@/lib/admin/client';
import type { Role, Staff } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  group: string;
}
const ALL: Role[] = ['admin', 'editor', 'author'];
const STAFF: Role[] = ['admin', 'editor'];

const ITEMS: Item[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ALL, group: '' },
  { href: '/admin/posts', label: 'Posts', icon: Newspaper, roles: ALL, group: 'Content' },
  { href: '/admin/photo-cards', label: 'Photo cards', icon: ImagesIcon, roles: ALL, group: 'Content' },
  { href: '/admin/videos', label: 'Videos', icon: Film, roles: ALL, group: 'Content' },
  { href: '/admin/media', label: 'Media library', icon: ImageIcon, roles: ALL, group: 'Content' },
  { href: '/admin/taxonomy', label: 'Categories & tags', icon: FolderTree, roles: ALL, group: 'Content' },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare, roles: STAFF, group: 'Audience' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Users2, roles: STAFF, group: 'Audience' },
  { href: '/admin/newsletters', label: 'Newsletters', icon: Mail, roles: STAFF, group: 'Audience' },
  { href: '/admin/users', label: 'Staff accounts', icon: Users, roles: ['admin'], group: 'Site' },
  { href: '/admin/settings', label: 'Site settings', icon: Settings, roles: ['admin'], group: 'Site' },
];

function Nav({ me, onNavigate }: { me: Staff; onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const items = ITEMS.filter((i) => i.roles.includes(me.role));
  const groups = [...new Set(items.map((i) => i.group))];
  const active = (href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`));

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Link href="/admin" onClick={onNavigate} className="block leading-none">
          <span className="block text-lg font-bold text-navy">সিলেটের জানালা</span>
          <span className="mt-1 inline-block bg-primary px-2 py-0.5 text-xs font-bold tracking-wide text-primary-foreground">NEWSROOM</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {groups.map((g) => (
          <div key={g}>
            {g && <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{g}</p>}
            <ul className="space-y-0.5">
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                        active(i.href) && 'bg-accent font-medium text-accent-foreground',
                      )}
                    >
                      <i.icon className="size-4" /> {i.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t p-3 text-sm">
        <div className="px-2 pb-1">
          <p className="truncate font-medium">{me.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{me.role}</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent">
          <ExternalLink className="size-4" /> View site
        </a>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent"
          onClick={async () => {
            await admin.post('/logout').catch(() => undefined);
            router.replace('/admin/login');
            router.refresh();
          }}
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ me, children }: { me: Staff; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-background lg:block">
        <Nav me={me} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="rounded-md p-2 hover:bg-accent">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Nav me={me} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-navy">সিলেটের জানালা</span>
        <span className="bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">NEWSROOM</span>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
