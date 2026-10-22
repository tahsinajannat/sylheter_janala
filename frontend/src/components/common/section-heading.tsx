import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  href?: string;
  linkLabel?: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

/** Section title with the brand's red bar; optional "view all" link. */
export function SectionHeading({ title, href, linkLabel, as: Tag = 'h2', className }: Props) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4 border-b-2 border-navy/10 pb-2', className)}>
      <Tag className="relative text-xl font-bold sm:text-2xl">
        <span className="absolute -bottom-[10px] left-0 h-[3px] w-full bg-primary" aria-hidden />
        {title}
      </Tag>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
