'use client';

import Link from 'next/link';
import { Container } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';

export default function NotFound() {
  const { lang, t } = useI18n();
  return (
    <Container className="py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t.common.notFoundTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.common.notFoundText}</p>
      <Button asChild className="mt-6">
        <Link href={routes.home(lang)}>{t.common.backHome}</Link>
      </Button>
    </Container>
  );
}
