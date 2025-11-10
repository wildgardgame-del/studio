'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGameStore } from '@/context/game-store-context';

type GameCardProps = {
  game: Game;
  className?: string;
};

export function GameCard({ game, className }: GameCardProps) {
  const { handleAddToCart, handleToggleWishlist, isInWishlist } = useGameStore();

  const isWishlisted = isInWishlist(game.id);

  return (
    <Card className={cn('group overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1', className)}>
      <CardHeader className="p-0">
        <Link href={`/games/${game.id}`} className="block overflow-hidden">
          <Image
            src={game.coverImage}
            alt={`Cover art for ${game.title}`}
            width={600}
            height={800}
            className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link href={`/games/${game.id}`}>
          <CardTitle className="font-headline text-lg truncate hover:text-primary">{game.title}</CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mt-1 truncate">{game.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-accent">${game.price}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleWishlist(game)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-accent text-accent' : 'text-muted-foreground')} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleAddToCart(game)}
            aria-label="Add to cart"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
