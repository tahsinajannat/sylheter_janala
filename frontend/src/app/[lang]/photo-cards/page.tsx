import type { Metadata } from 'next';
import { Container, EmptyState, Pagination } from '@/components/common';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, parsePage, type LangParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';
import { PhotoGrid } from '@/modules/photo-cards';

type Props = { params: LangParams; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await getLang(params);
  return buildMetadata({ lang, title: (await getDictionary(lang)).photos.title, path: '/photo-cards' });
}

export default async function Page({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const { data, meta } = await api.photoCards.list({ lang, page: parsePage((await searchParams).page), limit: 16 });
  return (
    <Container className="py-8">
      <h1 className="mb-8 border-b pb-4 text-3xl font-bold sm:text-4xl">{t.photos.title}</h1>
      {data.length === 0 ? (
        <EmptyState title={t.listing.noResults} />
      ) : (
        <>
          <PhotoGrid cards={data} lang={lang} photoLabel={t.photos.photographer} />
          <Pagination meta={meta} lang={lang} hrefFor={(p) => `${routes.photos(lang)}${p > 1 ? `?page=${p}` : ''}`} labels={t.listing} />
        </>
      )}
    </Container>
  );
}
