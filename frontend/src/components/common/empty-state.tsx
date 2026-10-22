import { cn } from '@/lib/utils';

export function EmptyState({ title, text, className, children }: { title: string; text?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-dashed py-14 text-center', className)}>
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 text-muted-foreground">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
