'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { admin, errorText } from '@/lib/admin/client';
import { cn } from '@/lib/utils';
import { selectClass } from './helpers';

// ───────── layout bits ─────────

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn('rounded-xl border bg-card p-4 sm:p-5', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(selectClass, className)} {...props} />;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

// ───────── status chips ─────────

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-sky-100 text-sky-900',
  published: 'bg-emerald-100 text-emerald-900',
  archived: 'bg-zinc-200 text-zinc-700',
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-red-100 text-red-900',
  spam: 'bg-zinc-200 text-zinc-700',
  active: 'bg-emerald-100 text-emerald-900',
  unsubscribed: 'bg-zinc-200 text-zinc-700',
  bounced: 'bg-red-100 text-red-900',
  sending: 'bg-sky-100 text-sky-900',
  sent: 'bg-emerald-100 text-emerald-900',
  failed: 'bg-red-100 text-red-900',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent capitalize', STATUS_STYLE[status])}>
      {status}
    </Badge>
  );
}

export function LangBadge({ lang }: { lang: string }) {
  return <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{lang}</span>;
}

// ───────── pager (server-rendered links) ─────────

export function Pager({ page, totalPages, total, pathname, query = {} }: { page: number; totalPages: number; total: number; pathname: string; query?: Record<string, string | undefined> }) {
  const to = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return s ? `${pathname}?${s}` : pathname;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} total · page {page} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={to(page - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ChevronLeft /> Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={to(page + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Next <ChevronRight />
          </Link>
        )}
      </div>
    </div>
  );
}

// ───────── dialogs ─────────

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-5 shadow-lg outline-none',
            wide ? 'max-w-4xl' : 'max-w-lg',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className={cn('mt-1 text-sm text-muted-foreground', !description && 'sr-only')}>{description ?? title}</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Runs an async action with a busy flag, success / error toasts and a page refresh. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const run = React.useCallback(
    async (fn: () => Promise<unknown>, opts: { success?: string; refresh?: boolean } = {}) => {
      setBusy(true);
      try {
        await fn();
        if (opts.success) toast.success(opts.success);
        if (opts.refresh !== false) router.refresh();
        return true;
      } catch (err) {
        toast.error(errorText(err));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );
  return { busy, run };
}

/** Trash button with a confirmation dialog. */
export function DeleteButton({
  path,
  title = 'Delete this item?',
  description = 'This cannot be undone.',
  label,
  onDone,
}: {
  path: string;
  title?: string;
  description?: string;
  label?: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { busy, run } = useAction();
  return (
    <>
      <Button type="button" variant="ghost" size={label ? 'sm' : 'icon'} className="text-destructive hover:text-destructive" aria-label="Delete" onClick={() => setOpen(true)}>
        <Trash2 /> {label}
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async () => {
              const ok = await run(() => admin.delete(path), { success: 'Deleted' });
              if (ok) {
                setOpen(false);
                onDone?.();
              }
            }}
          >
            {busy && <Loader2 className="animate-spin" />} Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function Spinner() {
  return <Loader2 className="size-4 animate-spin" />;
}

export function EmptyRow({ cols, text = 'Nothing here yet.' }: { cols: number; text?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-10 text-center text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}

/** Plain styled table shell. */
export function DataTable({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-3 [&_td]:py-2.5 [&_tr]:border-b [&_tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}
