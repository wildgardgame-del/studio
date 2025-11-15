
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { GameStoreClientProvider } from '@/context/game-store-client-provider';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGate } from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'Forge Gate Hub',
  description: 'Your universe of games. Discover, play, and publish on a platform that champions creators.',
  keywords: ['indie games', 'game development', 'publish games', 'game store', 'download games', 'new games'],
  authors: [{ name: 'Forge Gate Hub' }],
  openGraph: {
    title: 'Forge Gate Hub',
    description: 'Your universe of games. Discover, play, and publish on a platform that champions creators.',
    url: 'https://forgegatehub.store',
    siteName: 'Forge Gate Hub',
    images: [
      {
        url: 'https://i.imgur.com/T0v3ed9.jpeg', // Hero banner image
        width: 1920,
        height: 1080,
        alt: 'A breathtaking futuristic cityscape with flying vehicles and towering neon-lit skyscrapers.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge Gate Hub',
    description: 'Your universe of games. Discover, play, and publish on a platform that champions creators.',
    images: ['https://i.imgur.com/T0v3ed9.jpeg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/ForgegateLogo128.png" sizes="any" />
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
