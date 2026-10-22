'use client';

import { useEffect } from 'react';
import { Container, ErrorState } from '@/components/common';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n/provider';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  // Server-component errors lose their class in production, so this only reliably detects client-side ones.
  const down = error instanceof ApiError && error.isNetwork;
  return (
    <Container>
      <ErrorState title={t.common.errorTitle} text={down ? t.common.apiDown : t.common.errorText} retryLabel={t.common.retry} onRetry={reset} />
    </Container>
  );
}
