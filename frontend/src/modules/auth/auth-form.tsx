'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useReader } from '@/hooks/use-reader';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Reader login / registration (used for comments and saved stories). */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useReader();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // only same-site paths are accepted as the post-login destination
  const rawNext = params.get('next') ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : routes.home(lang);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim();
    const password = String(f.get('password'));
    setBusy(true);
    setError('');
    try {
      const session =
        mode === 'login'
          ? await api.auth.login({ email, password })
          : await api.auth.register({ name: String(f.get('name')).trim(), email, password, preferredLang: lang });
      signIn({ token: session.token, reader: session.reader });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.errorText);
    } finally {
      setBusy(false);
    }
  }

  const register = mode === 'register';
  const other = register ? routes.login(lang) : routes.register(lang);
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{register ? t.auth.registerTitle : t.auth.loginTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {register && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t.auth.name}</Label>
              <Input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" name="password" type="password" required minLength={register ? 8 : 1} maxLength={72} autoComplete={register ? 'new-password' : 'current-password'} />
            {register && <p className="text-xs text-muted-foreground">{t.auth.passwordHint}</p>}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {register ? t.auth.registerButton : t.auth.loginButton}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {register ? t.auth.haveAccount : t.auth.noAccount}{' '}
            <Link href={`${other}${rawNext ? `?next=${encodeURIComponent(rawNext)}` : ''}`} className="font-medium text-primary hover:underline">
              {register ? t.auth.loginButton : t.auth.registerButton}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
