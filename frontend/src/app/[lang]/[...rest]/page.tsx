import { notFound } from 'next/navigation';

/** Any unknown URL under /bn or /en renders the localized not-found page. */
export default function CatchAll() {
  notFound();
}
