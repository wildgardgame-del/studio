'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameStore } from '@/context/game-store-context';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Game } from '@/lib/types';


export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const { firestore } = useFirebase();

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);
  
  const { data: game, isLoading } = useDoc<Game>(gameRef);
  const { handleAddToCart, handleToggleWishlist, isInWishlist } = useGameStore();

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

  if (!game) {
    notFound();
  }
  
  const isWishlisted = isInWishlist(game.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Left Column: Cover Art & Actions */}
            <div className="md:col-span-2 lg:col-span-1">
              <Image
                src={game.coverImage || 'https://placehold.co/600x800'}
                alt={`Cover for ${game.title}`}
                width={600}
                height={800}
                className="rounded-lg object-cover aspect-[3/4] w-full"
              />
              <div className="mt-4 space-y-2">
                <Button size="lg" className="w-full" onClick={() => handleAddToCart(game)}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => handleToggleWishlist(game)}>
                  <Heart className={cn("mr-2 h-5 w-5", isWishlisted && "fill-accent text-accent")} />
                  {isWishlisted ? 'Na Lista de Desejos' : 'Adicionar à Lista de Desejos'}
                </Button>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-3 lg:col-span-4">
              <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">{game.title}</h1>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-5 w-5',
                        game.rating && i < Math.floor(game.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">{game.rating?.toFixed(1) || 'N/A'} ({game.reviews?.length || 0} avaliações)</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {game.genres?.map((genre) => (
                  <span key={genre} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {genre}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-lg text-muted-foreground">{game.longDescription}</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-accent">${game.price.toFixed(2)}</span>
              </div>

              <Tabs defaultValue="screenshots" className="w-full mt-8">
                <TabsList>
                  <TabsTrigger value="screenshots">Capturas de Ecrã</TabsTrigger>
                  <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                </TabsList>
                <TabsContent value="screenshots" className="mt-4">
                    {game.screenshots && game.screenshots.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                            {game.screenshots.map((ss, index) => (
                                <CarouselItem key={index}>
                                <Image src={ss} alt={`Screenshot ${index + 1} for ${game.title}`} width={1920} height={1080} className="rounded-lg object-cover aspect-video" />
                                </CarouselItem>
                            ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                        <p className='text-muted-foreground'>Não há capturas de ecrã disponíveis.</p>
                    )}
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                  <p className='text-muted-foreground'>Ainda não há avaliações. Seja o primeiro a deixar uma!</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
