'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { Button } from '@/components/ui/button';

interface Props {
  postId: string;
  url: string;
  title: string;
  initialCount: number;
}

/** Facebook / X / WhatsApp / copy-link. Each click is counted by the API (`POST /posts/:id/share`). */
export function ShareButtons({ postId, url, title, initialCount }: Props) {
  const { t } = useI18n();
  const [count, setCount] = useState(initialCount);
  const [copied, setCopied] = useState(false);

  const count1 = () => {
    api.posts
      .share(postId)
      .then((r) => setCount(r.shareCount))
      .catch(() => {});
  };

  const enc = encodeURIComponent;
  const targets = [
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
        <Share2 className="size-4" /> {t.article.share}
        {count > 0 && <span className="text-muted-foreground">({count})</span>}
      </span>
      {targets.map((s) => (
        <Button key={s.name} asChild variant="outline" size="sm">
          <a href={s.href} target="_blank" rel="noopener noreferrer" onClick={count1}>
            {s.name}
          </a>
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            count1();
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked */
          }
        }}
      >
        {copied ? <Check /> : <Link2 />} {copied ? t.article.linkCopied : t.article.copyLink}
      </Button>
    </div>
  );
}
