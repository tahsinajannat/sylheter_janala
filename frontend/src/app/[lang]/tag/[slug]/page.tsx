import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { decodeSlug, getLang, parsePage } from '@/lib/params';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';
import { ListingPage } from '@/modules/news';

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> };

async function load({ params, searchParams }: Props) {
  const lang = await getLang(params);
  const slug = decodeSlug((await params).slug);
  const page = parsePage((await searchParams).page);
  const [tags, list] = await Promise.all([api.taxonomy.tags(lang), api.posts.list({ lang, tag: slug, page, limit: 12 })]);
  const tag = tags.find((x) => x.slug === slug);
  // a tag with no published posts is not in the list; still show an empty page for a known-looking slug with results
  if (!tag && list.data.length === 0) notFound();
  return { lang, slug, name: tag?.name ?? slug, ...list };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { lang, slug, name } = await load(props);
  return buildMetadata({ lang, title: `#${name}`, path: `/tag/${encodeURIComponent(slug)}` });
}

export default async function Page(props: Props) {
  const { lang, slug, name, data, meta } = await load(props);
  const t = await getDictionary(lang);
  const base = routes.tag(lang, slug);
  return <ListingPage lang={lang} t={t} eyebrow={t.listing.tag} title={`#${name}`} posts={data} meta={meta} hrefFor={(p) => `${base}${p > 1 ? `?page=${p}` : ''}`} />;
}
