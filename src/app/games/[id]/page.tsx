'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Heart, ShoppingCart, Star } from 'lucide-react';

import { games } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

type GamePageProps = {
  params: {
    id: string;
  };
};

export default function GamePage({ params }: GamePageProps) {
  const game = games.find((g) => g.id === params.id);
  const { handleAddToCart, handleToggleWishlist, isInWishlist } = useGameStore();

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
                src={game.coverImage}
                alt={`Cover for ${game.title}`}
                width={600}
                height={800}
                className="rounded-lg object-cover aspect-[3/4] w-full"
              />
              <div className="mt-4 space-y-2">
                <Button size="lg" className="w-full" onClick={() => handleAddToCart(game)}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => handleToggleWishlist(game)}>
                  <Heart className={cn("mr-2 h-5 w-5", isWishlisted && "fill-accent text-accent")} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
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
                        i < Math.floor(game.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">{game.rating.toFixed(1)} ({game.reviews.length} reviews)</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <span key={genre} className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    {genre}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-lg text-muted-foreground">{game.longDescription}</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-accent">${game.price}</span>
              </div>

              <Tabs defaultValue="screenshots" className="w-full mt-8">
                <TabsList>
                  <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="screenshots" className="mt-4">
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
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                  <div className="space-y-6">
                    {game.reviews.map((review) => (
                      <Card key={review.id} className="bg-secondary/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                                <AvatarFallback>{review.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className='w-full'>
                                <div className='flex justify-between items-center'>
                                    <p className="font-semibold">{review.author}</p>
                                    <div className="flex items-center gap-1 text-sm">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn('h-4 w-4', i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-muted-foreground mt-1">{review.text}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
