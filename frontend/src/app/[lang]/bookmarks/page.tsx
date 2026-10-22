import type { Metadata } from 'next';
import { Container } from '@/components/common';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { BookmarksList } from '@/modules/auth';

export async function generateMetadata({ params }: { params: LangParams }): Promise<Metadata> {
  const lang = await getLang(params);
  return { ...buildMetadata({ lang, title: (await getDictionary(lang)).auth.bookmarksTitle, path: '/bookmarks' }), robots: { index: false } };
}

export default async function Page({ params }: { params: LangParams }) {
  const lang = await getLang(params);
  const t = await getDictionary(lang);
  return (
    <Container className="py-8">
      <h1 className="mb-8 border-b pb-4 text-3xl font-bold sm:text-4xl">{t.auth.bookmarksTitle}</h1>
      <BookmarksList />
    </Container>
  );
}
