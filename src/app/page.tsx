
'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import Autoplay from "embla-carousel-autoplay";

import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/game-card';
import heroImage from '@/lib/placeholder-images.json';
import { ArrowRight, Star, Loader2, Users, Cloud, Award } from 'lucide-react';
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
    let games = allFeaturedGames.filter(game => game.id !== 'dev-account-upgrade' && game.id !== 'dev-android-account-upgrade' && !game.isInDevelopment);
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
        <section className="relative h-[60vh] w-full min-h-[500px]">
          <Image
            src="/images/bannerForgegate.jpg"
            alt="Forge Gate Hub Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div>
              <Image src="/images/logo-512.png" alt="Forge Gate Hub Logo" width={200} height={200} className="mx-auto mb-2" />
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Enter the Forge
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground mx-auto">
                Forge your adventures, conquer epic worlds, and publish your own games on a platform that champions creators.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="font-bold">
                  <Link href="/browse">
                    Browse Games<ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
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
        
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <h2 className="font-headline text-3xl font-bold md:text-4xl mb-8 text-center">Why Forge Gate Hub?</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <Star className="h-7 w-7" />
                </div>
                <h3 className="font-headline text-xl font-bold mb-2">Curated Selection</h3>
                <p className="text-muted-foreground">Explore a universe of games, from indie gems to AAA blockbusters, hand-picked for quality and fun.</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                  <Award className="h-7 w-7"/>
                </div>
                <h3 className="font-headline text-xl font-bold mb-2">For Developers, By Developers</h3>
                <p className="text-muted-foreground">An intuitive developer dashboard, straightforward submission process, and a supportive community.</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
                 <Cloud className="h-7 w-7" />
                </div>
                <h3 className="font-headline text-xl font-bold mb-2">Seamless Cloud Experience</h3>
                <p className="text-muted-foreground">Powered by Firebase, ensuring a fast, secure, and scalable platform for both players and creators.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
