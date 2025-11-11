'use client';

import { collection, query } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { GameCard } from '@/components/game-card';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Library as LibraryIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Game } from '@/lib/types';
import Image from 'next/image';
import heroImage from '@/lib/placeholder-images.json';

export default function LibraryPage() {
  const { user, firestore } = useFirebase();

  const libraryQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'library'));
  }, [user, firestore]);

  const { data: purchasedGames, isLoading } = useCollection<Game>(libraryQuery);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
        <Image
            src={heroImage.placeholderImages[0].imageUrl}
            alt="Futuristic city background"
            data-ai-hint="cyberpunk city"
            fill
            className="object-cover -z-10"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Your Library</h1>
          <p className="text-muted-foreground mt-2">Games you own.</p>
          
          {purchasedGames && purchasedGames.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {purchasedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center rounded-lg bg-background/50 p-12">
              <LibraryIcon className="h-20 w-20 text-muted-foreground/50" />
              <h2 className="mt-6 font-headline text-2xl font-bold">Your library is empty</h2>
              <p className="mt-2 text-muted-foreground">Games you purchase will appear here.</p>
              <Link href="/browse" className="mt-6">
                <button className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                    Browse the Store
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
