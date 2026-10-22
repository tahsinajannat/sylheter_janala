import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { selectClass } from './helpers';

/** Plain GET filter bar (works without JavaScript). */
export function FilterBar({
  q,
  lang,
  status,
  type,
  searchable = true,
}: {
  q?: string;
  lang?: string;
  status?: string;
  type?: string;
  searchable?: boolean;
}) {
  return (
    <form className="mb-4 flex flex-wrap items-center gap-2">
      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search titles…" className="h-9 w-56 rounded-md border bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        </div>
      )}
      <select name="lang" defaultValue={lang ?? ''} className={cn(selectClass, 'w-auto')}>
        <option value="">All languages</option>
        <option value="bn">বাংলা</option>
        <option value="en">English</option>
      </select>
      <select name="status" defaultValue={status ?? ''} className={cn(selectClass, 'w-auto')}>
        <option value="">All statuses</option>
        {['draft', 'scheduled', 'published', 'archived'].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {type !== undefined && (
        <select name="type" defaultValue={type} className={cn(selectClass, 'w-auto')}>
          <option value="">News + editorials</option>
          <option value="news">News</option>
          <option value="editorial">Editorials</option>
        </select>
      )}
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
