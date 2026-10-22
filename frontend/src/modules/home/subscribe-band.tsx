import { Container } from '@/components/common';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { SubscribeForm } from '@/modules/subscribe';

export function SubscribeBand({ t }: { t: Dictionary }) {
  return (
    <section className="rounded-xl bg-accent px-6 py-10 text-center">
      <Container className="max-w-xl">
        <h2 className="text-2xl font-bold">{t.subscribe.title}</h2>
        <p className="mt-2 mb-5 text-muted-foreground">{t.subscribe.text}</p>
        <SubscribeForm source="home" />
      </Container>
    </section>
  );
}
