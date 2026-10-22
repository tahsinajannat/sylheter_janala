import type { Metadata } from 'next';
import { LoginForm } from '@/modules/admin/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 leading-none">
          <span className="block text-2xl font-bold text-navy">সিলেটের জানালা</span>
          <span className="mt-1 inline-block bg-primary px-2 py-0.5 text-sm font-bold tracking-wide text-primary-foreground">NEWSROOM</span>
        </div>
        {expired && <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Your session ended. Please sign in again.</p>}
        <LoginForm />
      </div>
    </div>
  );
}
