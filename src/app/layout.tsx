
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { GameStoreClientProvider } from '@/context/game-store-client-provider';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGate } from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'Forge Gate Hub',
  description: 'Your universe of games.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          'font-body dark' // Apply dark theme directly
        )}
      >
        <FirebaseClientProvider>
          <GameStoreClientProvider>
            <AuthGate>
              {children}
            </AuthGate>
            <Toaster />
          </GameStoreClientProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
