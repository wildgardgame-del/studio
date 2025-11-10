'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/game-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import heroImage from '@/lib/placeholder-images.json';
import { ArrowRight, Loader2, Star } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


export default function Home() {
  const { firestore } = useFirebase();

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "games"), 
        where("status", "==", "approved")
    );
  }, [firestore]);

  const { data: approvedGames, isLoading } = useCollection<Game>(gamesQuery);

  const featuredGames = approvedGames?.slice(0, 4) || [];
  const newReleases = approvedGames?.slice(2, 6) || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full">
          <Image
            src={heroImage.placeholderImages[0].imageUrl}
            alt={heroImage.placeholderImages[0].description}
            data-ai-hint={heroImage.placeholderImages[0].imageHint}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="relative bottom-[-10%]">
              <h1 className="font-headline text-5xl font-bold tracking-tighter md:text-7xl lg:text-8xl">
                Your Universe of Games
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Discover, purchase, and play your next favorite game. The ultimate destination for gamers.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg" className="font-bold">
                  <Link href="/browse">Browse Games</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">Featured Games</h2>
            <Button variant="link" asChild className="text-accent">
              <Link href="/browse">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[450px] w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>
        
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <h2 className="font-headline text-3xl font-bold md:text-4xl mb-8 text-center">Why GameSphere?</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="font-headline text-xl font-bold">Curated Selection</h3>
                <p className="text-muted-foreground">Explore a universe of games, from indie gems to AAA blockbusters, hand-picked for you.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                </div>
                <h3 className="font-headline text-xl font-bold">AI Recommendations</h3>
                <p className="text-muted-foreground">Our smart AI suggests games you'll love based on your unique play style.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9.09 9.91 5.82 5.82"/><path d="m14.91 9.91-5.82 5.82"/></svg>
                </div>
                <h3 className="font-headline text-xl font-bold">Seamless Experience</h3>
                <p className="text-muted-foreground">A user-friendly interface that makes finding and playing games a breeze.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16">
          <h2 className="font-headline text-3xl font-bold md:text-4xl mb-8">New Releases</h2>
           {isLoading ? (
             <div className="flex space-x-4">
                <Skeleton className="h-[450px] w-1/3" />
                <Skeleton className="h-[450px] w-1/3" />
                <Skeleton className="h-[450px] w-1/3" />
             </div>
           ) : (
            <Carousel opts={{ align: 'start', loop: newReleases.length > 2 }}>
                <CarouselContent>
                {newReleases.map((game) => (
                    <CarouselItem key={game.id} className="md:basis-1/2 lg:basis-1/3">
                    <GameCard game={game} />
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
           )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
