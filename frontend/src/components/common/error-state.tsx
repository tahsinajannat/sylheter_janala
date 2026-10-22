'use client';

import { Button } from '@/components/ui/button';

/** Shared UI for error boundaries (`error.tsx`). Receives strings so it works before i18n context exists. */
export function ErrorState({ title, text, retryLabel, onRetry }: { title: string; text: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{text}</p>
      <Button className="mt-6" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
