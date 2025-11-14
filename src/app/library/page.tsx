'use client';

import { collection, query, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { GameCard } from '@/components/game-card';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Library as LibraryIcon, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import type { Game } from '@/lib/types';
import Image from 'next/image';
import heroImage from '@/lib/placeholder-images.json';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

type LibraryItem = {
  gameId: string;
  purchasedAt: any;
}

function LibraryGameCard({ gameId }: { gameId: string }) {
  const { firestore } = useFirebase();
  
  const gameRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);
  
  const { data: game, isLoading } = useDoc<Game>(gameRef);

  if (isLoading) {
    return <Skeleton className="h-[450px] w-full" />;
  }

  if (!game) {
    // This could happen if a game was deleted after purchase.
    // You could show a placeholder or an "unavailable" message.
    return (
        <div className="border rounded-lg p-4 text-center aspect-[3/4] flex flex-col justify-center">
            <p className="text-sm text-muted-foreground">Game data not found.</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <GameCard game={game} />
      {game.gameFileUrl && (
        <Button asChild>
          <a href={game.gameFileUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      )}
    </div>
  );
}


export default function LibraryPage() {
  const { user, firestore } = useFirebase();

  const libraryQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This query fetches the references to the games in the user's library.
    return query(collection(firestore, 'users', user.uid, 'library'));
  }, [user, firestore]);

  // `data` here will be an array of `LibraryItem` objects, e.g., [{ gameId: 'cyberpunk-samurai', ... }]
  const { data: libraryItems, isLoading } = useCollection<LibraryItem>(libraryQuery);

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
          
          {libraryItems && libraryItems.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {libraryItems.map((item) => (
                <LibraryGameCard key={item.gameId} gameId={item.gameId} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center rounded-lg bg-background/50 p-12">
              <LibraryIcon className="h-20 w-20 text-muted-foreground/50" />
              <h2 className="mt-6 font-headline text-2xl font-bold">Your library is empty</h2>
              <p className="mt-2 text-muted-foreground">Games you purchase will appear here.</p>
              <Link href="/browse" className="mt-6">
                <Button>
                    Browse the Store
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
