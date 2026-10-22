'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Comment } from '@/lib/api/types';
import { useReader } from '@/hooks/use-reader';
import { formatDateTime } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function CommentItem({ c, replies, lang, onReply }: { c: Comment; replies: Comment[]; lang: 'bn' | 'en'; onReply?: (c: Comment) => void }) {
  const { t } = useI18n();
  return (
    <li className="space-y-2">
      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm font-semibold">
          {c.author.name} <span className="ml-2 text-xs font-normal text-muted-foreground">{formatDateTime(c.createdAt, lang)}</span>
        </p>
        <p className="mt-1 whitespace-pre-line">{c.body}</p>
        {onReply && (
          <button type="button" className="mt-1 text-xs font-medium text-primary hover:underline" onClick={() => onReply(c)}>
            {t.article.reply}
          </button>
        )}
      </div>
      {replies.length > 0 && (
        <ul className="ml-6 space-y-2 border-l pl-4">
          {replies.map((r) => (
            <CommentItem key={r.id} c={r} replies={[]} lang={lang} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentsSection({ postId }: { postId: string }) {
  const { lang, t } = useI18n();
  const { token } = useReader();
  const pathname = usePathname();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [parent, setParent] = useState<Comment | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'pending' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    api.posts
      .comments(postId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !text.trim()) return;
    setState('sending');
    try {
      await api.posts.addComment(postId, token, { body: text.trim(), parentId: parent?.id });
      setText('');
      setParent(null);
      setState('pending'); // goes through moderation, so it is not added to the list
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.errorText);
      setState('error');
    }
  }

  const top = (comments ?? []).filter((c) => !c.parentId);
  const repliesOf = (id: string) => (comments ?? []).filter((c) => c.parentId === id);

  return (
    <section aria-labelledby="comments-title" className="space-y-5">
      <h2 id="comments-title" className="text-xl font-bold">
        {t.article.comments}
      </h2>

      {comments && top.length === 0 && <p className="text-muted-foreground">{t.article.noComments}</p>}
      <ul className="space-y-4">
        {top.map((c) => (
          <CommentItem key={c.id} c={c} replies={repliesOf(c.id)} lang={lang} onReply={token ? setParent : undefined} />
        ))}
      </ul>

      {token ? (
        <form onSubmit={submit} className="space-y-2">
          {parent && (
            <p className="text-sm text-muted-foreground">
              {t.article.reply}: <strong>{parent.author.name}</strong>{' '}
              <button type="button" onClick={() => setParent(null)} className="text-primary hover:underline">
                ×
              </button>
            </p>
          )}
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.article.commentPlaceholder} maxLength={2000} required />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={state === 'sending'}>
              {t.article.commentSubmit}
            </Button>
            <p role="status" className={state === 'error' ? 'text-sm text-destructive' : 'text-sm text-emerald-700'}>
              {state === 'pending' && t.article.commentPending}
              {state === 'error' && error}
            </p>
          </div>
        </form>
      ) : (
        <p className="text-sm">
          <Link href={`${routes.login(lang)}?next=${encodeURIComponent(pathname)}`} className="font-medium text-primary hover:underline">
            {t.article.commentLogin}
          </Link>
        </p>
      )}
    </section>
  );
}
