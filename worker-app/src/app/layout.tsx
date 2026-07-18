import './globals.css';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/state/SessionProvider';
import { SyncProvider } from '@/state/SyncProvider';

export const metadata = {
  title: 'Continuum',
  description: 'Your recovery check-ins',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SyncProvider>{children}</SyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
