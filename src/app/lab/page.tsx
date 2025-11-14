
'use client';

import { Suspense, useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, FlaskConical } from 'lucide-react';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import type { Game } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { GameCard } from '@/components/game-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

function LabPageContent() {
  const { firestore } = useFirebase();

  const labGamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "games"),
      where("status", "==", "approved"),
      where("isInDevelopment", "==", true)
    );
  }, [firestore]);

  const { data: labGames, isLoading } = useCollection<Game>(labGamesQuery);

  const filteredGames = useMemo(() => {
    if (!labGames) return [];
    return labGames.filter(game => game.id !== 'dev-account-upgrade' && game.id !== 'dev-android-account-upgrade');
  }, [labGames]);

  return (
    <div className="relative flex min-h-screen flex-col">
       <Image
        src="/images/GamerF.jpg"
        alt="Developer working on a game"
        fill
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="text-center">
            <FlaskConical className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
              The Lab
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              A sneak peek at the future. Explore games that are currently in development and follow their progress.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} hidePrice />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center bg-secondary/30 rounded-lg py-16">
              <FlaskConical className="h-20 w-20 text-muted-foreground/50" />
              <h2 className="mt-6 font-headline text-2xl font-bold">The Lab is Quiet</h2>
              <p className="mt-2 text-muted-foreground max-w-sm">
                There are no "in-development" games to show right now. Check back soon to see what our creators are cooking up!
              </p>
              <Button asChild className="mt-6">
                <Link href="/browse">Explore Released Games</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LabPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LabPageContent />
    </Suspense>
  );
}
