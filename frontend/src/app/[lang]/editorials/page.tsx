import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, parsePage, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { ListingPage } from '@/modules/news';

type Props = { params: LangParams; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await getLang(params);
  return buildMetadata({ lang, title: (await getDictionary(lang)).listing.editorials, path: '/editorials' });
}

export default async function Page({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  const { data, meta } = await api.posts.list({ lang, type: 'editorial', page: parsePage((await searchParams).page), limit: 12 });
  return <ListingPage lang={lang} t={t} title={t.listing.editorials} posts={data} meta={meta} hrefFor={(p) => `/${lang}/editorials${p > 1 ? `?page=${p}` : ''}`} />;
}
