import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { decodeSlug, getLang, parsePage } from '@/lib/params';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';
import { ListingPage } from '@/modules/news';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> };

async function load({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const slug = decodeSlug((await params).slug);
  const page = parsePage((await searchParams).page);
  const [categories, list] = await Promise.all([api.taxonomy.categories(lang), api.posts.list({ lang, category: slug, page, limit: 12 })]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return { lang, slug, category, ...list };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { lang, slug, category } = await load(props);
  return buildMetadata({ lang, title: category.name, path: `/category/${encodeURIComponent(slug)}` });
}

export default async function Page(props: Props) {
  const { lang, slug, category, data, meta } = await load(props);
  const t = await getDictionary(lang);
  const base = routes.category(lang, slug);
  return <ListingPage lang={lang} t={t} eyebrow={t.listing.category} title={category.name} posts={data} meta={meta} hrefFor={(p) => `${base}${p > 1 ? `?page=${p}` : ''}`} />;
}
