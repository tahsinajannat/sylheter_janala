import type { Metadata } from 'next';
import { Container } from '@/components/common';
import { api } from '@/lib/api';
import { orNotFound } from '@/lib/api/safe';
import { decodeSlug, getLang } from '@/lib/params';
import { buildMetadata } from '@/lib/seo';
import { VideoDetail } from '@/modules/videos';

type Props = { params: Promise<{ lang: string; slug: string }> };

const load = async (params: Props['params']) => {
  const lang = await getLang(params);
  return { lang, video: await orNotFound(api.videos.get(decodeSlug((await params).slug), lang)) };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, video } = await load(params);
  return buildMetadata({ lang, title: video.title, description: video.description, path: `/videos/${encodeURIComponent(video.slug)}`, image: video.thumbnail });
}

export default async function Page({ params }: Props) {
  const { lang, video } = await load(params);
  return (
    <Container className="py-8">
      <VideoDetail video={video} lang={lang} />
    </Container>
  );
}
