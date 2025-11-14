
'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Heart, ShoppingCart, Star, Link as LinkIcon, Youtube, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useDoc, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import type { Game } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
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
import { useQuery } from '@tanstack/react-query';
import { Reviews } from '@/components/reviews';
import { Separator } from '@/components/ui/separator';


function GamePageContent() {
  const params = useParams();
  const id = params.id as string;
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { handleAddToCart, handleToggleWishlist, isInWishlist, isPurchased } = useGameStore();

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'games', id);
  }, [firestore, id]);

  const { data: game, isLoading: isGameDataLoading } = useDoc<Game>(gameRef);
  
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists() || user.email === 'forgegatehub@gmail.com';
    },
    enabled: !!user && !!firestore,
  });

  const isLoading = isGameDataLoading || isAdminLoading;
  
  const isWishlisted = game ? isInWishlist(game.id) : false;
  const gameIsPurchased = game ? isPurchased(game.id) : false;
  
  const getYouTubeVideoId = (url: string): string | null => {
      try {
          const videoUrl = new URL(url);
          if (videoUrl.hostname === 'www.youtube.com' || videoUrl.hostname === 'youtube.com') {
              return videoUrl.searchParams.get('v');
          }
          if (videoUrl.hostname === 'youtu.be') {
              return videoUrl.pathname.slice(1);
          }
      } catch (e) {
          console.error('Invalid URL for YouTube video', url);
      }
      return null;
  }
  
  const canViewGame = game && (game.status === 'approved' || isAdmin);

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

  if (!game || !canViewGame) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold font-headline mb-2">Game Not Available</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    {game && !isAdmin ? 'This game is currently under review and not available to the public yet.' : 'The game you are looking for does not exist or has been removed.'}
                </p>
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
          {game.status !== 'approved' && isAdmin && (
            <div className="mb-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
              <p className="font-bold">Admin Preview Mode</p>
              <p className="text-sm">You are viewing this page as an admin. This game has a status of <span className="font-semibold">{game.status}</span> and is not visible to the public.</p>
            </div>
          )}
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
                <div className="space-y-2">
                    {game.websiteUrl && (
                        <Button asChild variant="secondary" className="w-full">
                            <a href={game.websiteUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2" /> Official Website
                            </a>
                        </Button>
                    )}
                    {game.trailerUrls && game.trailerUrls.length > 0 && (
                         <Button asChild variant="secondary" className="w-full">
                            <a href={game.trailerUrls[0]} target="_blank" rel="noopener noreferrer">
                                <Youtube className="mr-2" /> Watch Trailer
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 lg:col-span-3 space-y-8">
               <div>
                    <h1 className="text-4xl lg:text-5xl font-bold font-headline">{game.title}</h1>
                    {game.publisher && <p className="text-xl text-muted-foreground mt-1">by {game.publisher}</p>}
                </div>
               
               <div className="flex flex-wrap gap-2">
                  {game.genres.map(genre => (
                    <Badge key={genre} variant="secondary" className="text-sm">{genre}</Badge>
                  ))}
               </div>

               <div className="prose prose-invert max-w-none text-muted-foreground text-lg">
                  <p>{game.longDescription || game.description}</p>
               </div>
               
              {game.screenshots && game.screenshots.length > 0 && (
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
              )}
               
                {game.trailerUrls && game.trailerUrls.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-4">Trailers</h2>
                         <Carousel opts={{ align: "start", loop: false, }} className="w-full">
                            <CarouselContent>
                                {game.trailerUrls.map((url, index) => {
                                    const videoId = getYouTubeVideoId(url);
                                    return videoId ? (
                                        <CarouselItem key={index} className="md:basis-full lg:basis-1/2">
                                            <div className="aspect-video">
                                                <iframe
                                                    className="w-full h-full rounded-lg"
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    title={`YouTube video player for ${game.title} - Trailer ${index + 1}`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </CarouselItem>
                                    ) : null;
                                })}
                            </CarouselContent>
                            <CarouselPrevious className="-ml-2" />
                            <CarouselNext className="-mr-2" />
                        </Carousel>
                    </div>
                )}

                <Separator />
                
                <Reviews gameId={id} />

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <GamePageContent />
        </Suspense>
    )
}
