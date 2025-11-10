'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Heart, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { Game } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/context/game-store-context';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


export default function GamePage() {
  const params = useParams();
  const id = params.id as string;
  const { firestore } = useFirebase();
  const { handleAddToCart, handleToggleWishlist, isInWishlist, isPurchased } = useGameStore();

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'games', id);
  }, [firestore, id]);

  const { data: game, isLoading } = useDoc<Game>(gameRef);
  
  const isWishlisted = game ? isInWishlist(game.id) : false;
  const gameIsPurchased = game ? isPurchased(game.id) : false;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading game details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
                <h1 className="text-2xl font-bold font-headline mb-8">Game not found.</h1>
                <p className="text-muted-foreground mb-8">Could not load details for this game.</p>
                <Button asChild>
                    <Link href="/browse">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Store
                    </Link>
                </Button>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Header />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Left Column */}
            <div className="md:col-span-1 lg:col-span-1 space-y-4">
              <Image
                src={game.coverImage}
                alt={`Cover art for ${game.title}`}
                width={600}
                height={800}
                className="rounded-lg object-cover aspect-[3/4] shadow-lg w-full"
              />
              <div className="space-y-2">
                <Button size="lg" className="w-full" onClick={() => handleAddToCart(game)} disabled={gameIsPurchased}>
                   <ShoppingCart className="mr-2" /> {gameIsPurchased ? 'In Library' : `Buy for $${game.price.toFixed(2)}`}
                </Button>
                 <Button size="lg" variant="outline" className="w-full" onClick={() => handleToggleWishlist(game)} disabled={gameIsPurchased}>
                    <Heart className={cn("mr-2", isWishlisted && 'fill-accent text-accent')} />
                    {isWishlisted ? 'On Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 lg:col-span-3 space-y-6">
               <h1 className="text-4xl lg:text-5xl font-bold font-headline">{game.title}</h1>
               
               <div className="flex flex-wrap gap-2">
                  {game.genres.map(genre => (
                    <Badge key={genre} variant="secondary" className="text-sm">{genre}</Badge>
                  ))}
               </div>

               <div className="prose prose-invert max-w-none text-muted-foreground text-lg">
                  <p>{game.longDescription || game.description}</p>
               </div>

               <div>
                 <h2 className="text-2xl font-bold font-headline mb-4">Screenshots</h2>
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {(game.screenshots || []).map((ss, index) => (
                        <CarouselItem key={index} className="md:basis-1/2">
                          <Image src={ss} alt={`Screenshot ${index + 1} of ${game.title}`} width={1920} height={1080} className="rounded-lg aspect-video object-cover" />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="ml-14" />
                    <CarouselNext className="mr-14" />
                  </Carousel>
               </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
