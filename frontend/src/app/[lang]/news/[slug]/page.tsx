import type { Metadata } from 'next';
import { Container } from '@/components/common';
import { api } from '@/lib/api';
import { orNotFound } from '@/lib/api/safe';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { decodeSlug, getLang, type LangParams } from '@/lib/params';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';
import { ArticleView } from '@/modules/news';

type Props = { params: LangParams & Promise<{ lang: string; slug: string }> };

const load = async (params: Props['params']) => {
  const lang = await getLang(params);
  const { slug } = await params;
  return { lang, post: await orNotFound(api.posts.get(decodeSlug(slug), lang)) };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, post } = await load(params);
  const other = post.translations.find((x) => x.lang !== lang);
  return buildMetadata({
    lang,
    title: post.seo.title,
    description: post.seo.description ?? post.excerpt,
    path: `/news/${encodeURIComponent(post.slug)}`,
    image: post.image?.url,
    type: 'article',
    publishedTime: post.publishedAt,
    alternates: other
      ? { [lang]: `/news/${encodeURIComponent(post.slug)}`, [other.lang]: `/news/${encodeURIComponent(other.slug)}` }
      : { [lang]: `/news/${encodeURIComponent(post.slug)}` },
  });
}

export default async function Page({ params }: Props) {
  const { lang, post } = await load(params);
  return (
    <Container className="py-8">
      <ArticleView post={post} lang={lang} t={await getDictionary(lang)} />
    </Container>
  );
}
