import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, parsePage, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { ListingPage, SearchBox } from '@/modules/news';

type Props = { params: LangParams; searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await getLang(params);
  return { ...buildMetadata({ lang, title: (await getDictionary(lang)).listing.searchTitle, path: '/search' }), robots: { index: false } };
}

export default async function Page({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const searching = q.length >= 2;
  const result = searching ? await api.posts.list({ lang, q, page: parsePage(sp.page), limit: 12 }) : { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };

  return (
    <ListingPage
      lang={lang}
      t={t}
      title={searching ? `${t.listing.searchResults} “${q}”` : t.listing.searchTitle}
      posts={result.data}
      meta={result.meta}
      hrefFor={(p) => `/${lang}/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ''}`}
      emptyText={searching ? t.listing.noResults : t.listing.searchHint}
    >
      <SearchBox defaultValue={q} />
    </ListingPage>
  );
}
