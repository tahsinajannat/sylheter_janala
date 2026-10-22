import { notFound } from 'next/navigation';
import { ApiError } from './errors';

/** For detail pages: an API 404 becomes Next's `notFound()`; every other error reaches the error boundary. */
export async function orNotFound<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}
