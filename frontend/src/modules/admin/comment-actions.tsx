'use client';

import { Check, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { admin } from '@/lib/admin/client';
import type { CommentStatus } from '@/lib/admin/types';
import { DeleteButton, useAction } from './ui';

export function CommentActions({ id, current }: { id: string; current: CommentStatus }) {
  const { busy, run } = useAction();
  const set = (status: CommentStatus) => run(() => admin.patch(`/comments/${id}`, { status }), { success: 'Updated' });
  return (
    <div className="flex flex-wrap items-center gap-1">
      {current !== 'approved' && (
        <Button size="sm" disabled={busy} onClick={() => set('approved')}>
          <Check /> Approve
        </Button>
      )}
      {current !== 'rejected' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => set('rejected')}>
          <X /> Reject
        </Button>
      )}
      {current !== 'spam' && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => set('spam')}>
          <ShieldAlert /> Spam
        </Button>
      )}
      <DeleteButton path={`/comments/${id}`} title="Delete this comment?" description="Replies to it are deleted too." />
    </div>
  );
}
