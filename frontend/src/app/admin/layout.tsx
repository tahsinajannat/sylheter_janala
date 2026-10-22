import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Newsroom', template: '%s | Newsroom' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: '#2e3047' };

// Every admin page depends on the signed-in user, so nothing here is cached.
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
