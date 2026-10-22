import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLang, type LangParams } from '@/lib/params';
import { HomePage } from '@/modules/home';

export default async function Page({ params }: { params: LangParams }) {
  const lang = await getLang(params);
  return <HomePage lang={lang} t={await getDictionary(lang)} />;
}
