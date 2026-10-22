import type { Metadata } from 'next';
import { Container } from '@/components/common';
import { api } from '@/lib/api';
import { orNotFound } from '@/lib/api/safe';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { decodeSlug, getLang } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { PhotoDetail } from '@/modules/photo-cards';

type Props = { params: Promise<{ lang: string; slug: string }> };

const load = async (params: Props['params']) => {
  const lang = await getLang(params);
  return { lang, card: await orNotFound(api.photoCards.get(decodeSlug((await params).slug), lang)) };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, card } = await load(params);
  return buildMetadata({ lang, title: card.title, description: card.caption, path: `/photo-cards/${encodeURIComponent(card.slug)}`, image: card.image.url });
}

export default async function Page({ params }: Props) {
  const { lang, card } = await load(params);
  return (
    <Container className="py-8">
      <PhotoDetail card={card} lang={lang} t={await getDictionary(lang)} />
    </Container>
  );
}
