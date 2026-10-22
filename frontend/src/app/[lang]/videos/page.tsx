import type { Metadata } from 'next';
import { Container, EmptyState, Pagination } from '@/components/common';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, parsePage, type LangParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';
import { VideoCard } from '@/modules/videos';

type Props = { params: LangParams; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await getLang(params);
  return buildMetadata({ lang, title: (await getDictionary(lang)).videos.title, path: '/videos' });
}

export default async function Page({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const { data, meta } = await api.videos.list({ lang, page: parsePage((await searchParams).page), limit: 12 });
  return (
    <Container className="py-8">
      <h1 className="mb-8 border-b pb-4 text-3xl font-bold sm:text-4xl">{t.videos.title}</h1>
      {data.length === 0 ? (
        <EmptyState title={t.listing.noResults} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((v) => (
              <VideoCard key={v.id} video={v} lang={lang} />
            ))}
          </div>
          <Pagination meta={meta} lang={lang} hrefFor={(p) => `${routes.videos(lang)}${p > 1 ? `?page=${p}` : ''}`} labels={t.listing} />
        </>
      )}
    </Container>
  );
}
