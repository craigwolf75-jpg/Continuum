import './globals.css';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/state/SessionProvider';

export const metadata = { title: 'Continuum', description: 'Your recovery check-ins' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
