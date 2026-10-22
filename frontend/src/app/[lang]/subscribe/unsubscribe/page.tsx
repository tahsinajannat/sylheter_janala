import type { Metadata } from 'next';
import { Container } from '@/components/common';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { UnsubscribePanel } from '@/modules/subscribe';

type Props = { params: LangParams; searchParams: Promise<{ token?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await getLang(params);
  return { ...buildMetadata({ lang, title: (await getDictionary(lang)).subscribe.unsubscribeTitle }), robots: { index: false } };
}

export default async function Page({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const { token } = await searchParams;
  return (
    <Container className="max-w-xl py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">{t.subscribe.unsubscribeTitle}</h1>
      <UnsubscribePanel token={token} />
    </Container>
  );
}
