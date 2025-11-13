'use client';

import { GameCard } from '@/components/game-card';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { useGameStore } from '@/context/game-store-context';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlistItems } = useGameStore();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Your Wishlist</h1>
          <p className="text-muted-foreground mt-2">Games you've saved for later.</p>
          
          {wishlistItems.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {wishlistItems.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <Heart className="h-20 w-20 text-muted-foreground/50" />
              <h2 className="mt-6 font-headline text-2xl font-bold">Your wishlist is empty</h2>
              <p className="mt-2 text-muted-foreground">Add games to your wishlist to keep track of them here.</p>
              <Link href="/browse" className="mt-6">
                <button className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                    Browse Games
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
