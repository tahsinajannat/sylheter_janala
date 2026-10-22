'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done' } | { kind: 'error'; message: string };

/** Newsletter signup (double opt-in: the API emails a confirmation link). */
export function SubscribeForm({ source, tone = 'light', className }: { source: string; tone?: 'light' | 'dark'; className?: string }) {
  const { lang, t } = useI18n();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      await api.subscribers.subscribe({ email: email.trim(), lang, source });
      setState({ kind: 'done' });
      setEmail('');
    } catch (err) {
      const invalid = err instanceof ApiError && err.status === 400;
      setState({ kind: 'error', message: invalid ? t.subscribe.invalidEmail : err instanceof ApiError ? err.message : t.common.errorText });
    }
  }

  const dark = tone === 'dark';
  return (
    <form onSubmit={onSubmit} className={cn('space-y-2', className)} noValidate>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className={cn('pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2', dark ? 'text-white/50' : 'text-muted-foreground')} />
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.subscribe.placeholder}
            aria-label={t.subscribe.placeholder}
            aria-invalid={state.kind === 'error'}
            className={cn('pl-9', dark && 'border-white/25 bg-white/10 text-white placeholder:text-white/50')}
          />
        </div>
        <Button type="submit" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? t.subscribe.sending : t.subscribe.button}
        </Button>
      </div>
      <p role="status" aria-live="polite" className={cn('min-h-5 text-sm', state.kind === 'error' ? (dark ? 'text-red-300' : 'text-destructive') : dark ? 'text-emerald-300' : 'text-emerald-700')}>
        {state.kind === 'done' && t.subscribe.success}
        {state.kind === 'error' && state.message}
      </p>
    </form>
  );
}
