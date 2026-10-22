'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';

function Result({ ok, text }: { ok: boolean; text: string }) {
  const { lang, t } = useI18n();
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="space-y-4 text-center">
      <Icon className={ok ? 'mx-auto size-12 text-emerald-600' : 'mx-auto size-12 text-destructive'} />
      <p className="text-lg">{text}</p>
      <Button asChild variant="outline">
        <Link href={routes.home(lang)}>{t.common.backHome}</Link>
      </Button>
    </div>
  );
}

/** Opened from the email link: confirms the subscription once on mount (POST - mail scanners only GET). */
export function ConfirmPanel({ token }: { token?: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>(token ? 'loading' : 'fail');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // React strict mode runs effects twice in dev
    api.subscribers
      .confirm(token)
      .then(() => setState('ok'))
      .catch(() => setState('fail'));
  }, [token]);

  if (state === 'loading')
    return (
      <p className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> {t.common.loading}
      </p>
    );
  return <Result ok={state === 'ok'} text={state === 'ok' ? t.subscribe.confirmOk : token ? t.subscribe.confirmFail : t.subscribe.missingToken} />;
}

/** Asks first (a prefetching mail client must not unsubscribe people), then POSTs. */
export function UnsubscribePanel({ token }: { token?: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'ask' | 'busy' | 'ok' | 'fail'>(token ? 'ask' : 'fail');

  async function go() {
    if (!token) return;
    setState('busy');
    try {
      await api.subscribers.unsubscribe(token);
      setState('ok');
    } catch {
      setState('fail');
    }
  }

  if (state === 'ok') return <Result ok text={t.subscribe.unsubscribeOk} />;
  if (state === 'fail') return <Result ok={false} text={token ? t.subscribe.unsubscribeFail : t.subscribe.missingToken} />;
  return (
    <div className="space-y-4 text-center">
      <p className="text-lg">{t.subscribe.unsubscribeText}</p>
      <Button onClick={go} disabled={state === 'busy'}>
        {t.subscribe.unsubscribeButton}
      </Button>
    </div>
  );
}
