
'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import Autoplay from "embla-carousel-autoplay";

import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/game-card';
import heroImage from '@/lib/placeholder-images.json';
import { ArrowRight, Star, Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useFirebase, useCollection, useMemoFirebase, useUser, useQuery } from '@/firebase';
import { collection, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';


export default function Home() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [showAdultContent, setShowAdultContent] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isUserCheckLoading, setIsUserCheckLoading] = useState(true);

  // Effect to check user's age verification and load content preference
  useEffect(() => {
    const checkUser = async () => {
      if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          const userIsVerified = userDoc.exists() && userDoc.data().isAgeVerified;
          setIsAgeVerified(userIsVerified);

          if (userIsVerified) {
            const savedPreference = localStorage.getItem('showAdultContent');
            setShowAdultContent(savedPreference === 'true');
          } else {
            setShowAdultContent(false);
          }
        } catch (e) {
          console.error("Error checking user age verification:", e);
          setIsAgeVerified(false);
          setShowAdultContent(false);
        }
      } else {
        setIsAgeVerified(false);
        setShowAdultContent(false);
      }
      setIsUserCheckLoading(false);
    };

    checkUser();
  }, [user, firestore]);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, "games"), 
        where("status", "==", "approved")
    );
  }, [firestore]);

  const { data: allFeaturedGames, isLoading: areGamesLoading } = useCollection<Game>(gamesQuery);

  const filteredFeaturedGames = useMemo(() => {
    if (!allFeaturedGames) return [];
    let games = allFeaturedGames.filter(game => game.id !== 'dev-account-upgrade' && game.id !== 'dev-android-account-upgrade');
    if (showAdultContent && isAgeVerified) {
      return games;
    }
    return games.filter(game => !game.isAdultContent);
  }, [allFeaturedGames, showAdultContent, isAgeVerified]);
  
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  const isLoading = areGamesLoading || isUserCheckLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[50vh] w-full">
          <Image
            src={heroImage.placeholderImages[0].imageUrl}
            alt={heroImage.placeholderImages[0].description}
            data-ai-hint={heroImage.placeholderImages[0].imageHint}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div>
              <Image src="/images/logo-512.png" alt="Forge Gate Hub Logo" width={256} height={256} className="mx-auto mb-4" />
              <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl">
                Enter the Forge
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground mx-auto">
                Forge your adventures and conquer epic worlds.
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
             <Carousel
              plugins={[plugin.current]}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {filteredFeaturedGames.map((game) => (
                  <CarouselItem key={game.id} className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="p-1">
                      <GameCard game={game} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-14" />
              <CarouselNext className="mr-14" />
            </Carousel>
          )}
        </section>
        
        <section className="bg-secondary/50 py-8">
          <div className="container">
            <h2 className="font-headline text-xl font-bold md:text-2xl mb-4 text-center">Why Forge Gate Hub?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-headline text-base font-bold">Curated Selection</h3>
                <p className="text-muted-foreground text-xs">Explore a universe of games, from indie gems to AAA blockbusters, hand-picked for you.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                </div>
                <h3 className="font-headline text-base font-bold">AI Recommendations</h3>
                <p className="text-muted-foreground text-xs">Our smart AI suggests games you'll love based on your unique play style.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9.09 9.91 5.82 5.82"/><path d="m14.91 9.91-5.82 5.82"/></svg>
                </div>
                <h3 className="font-headline textBase font-bold">Seamless Experience</h3>
                <p className="text-muted-foreground text-xs">A user-friendly interface that makes finding and playing games a breeze.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
