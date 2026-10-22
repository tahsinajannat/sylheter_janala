import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@/components/common';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, type LangParams } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { AuthForm } from '@/modules/auth';

export async function generateMetadata({ params }: { params: LangParams }): Promise<Metadata> {
  const lang = await getLang(params);
  return { ...buildMetadata({ lang, title: (await getDictionary(lang)).auth.registerTitle, path: '/register' }), robots: { index: false } };
}

export default async function Page({ params }: { params: LangParams }) {
  await getLang(params);
  return (
    <Container className="py-12">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </Container>
  );
}
