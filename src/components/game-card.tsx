'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Library, ShoppingCart } from 'lucide-react';
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
import { Badge } from './ui/badge';

type GameCardProps = {
  game: Game;
  className?: string;
};

export function GameCard({ game, className }: GameCardProps) {
  const { handleAddToCart, handleToggleWishlist, isInWishlist, isPurchased } = useGameStore();

  const isWishlisted = isInWishlist(game.id);
  const gameIsPurchased = isPurchased(game.id);

  return (
    <Card className={cn('group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1', className)}>
      {gameIsPurchased && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
          <Library className="h-3 w-3" />
          <span>Na Biblioteca</span>
        </div>
      )}
      <CardHeader className="p-0">
        <Link href={`/games/${game.id}`} className="block overflow-hidden">
          <Image
            src={game.coverImage || `https://picsum.photos/seed/${game.id}/600/800`}
            alt={`Cover art for ${game.title}`}
            width={600}
            height={800}
            className={cn(
                "aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105",
                gameIsPurchased && "opacity-50"
            )}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <Link href={`/games/${game.id}`}>
          <CardTitle className="font-headline text-lg truncate hover:text-primary">{game.title}</CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mt-1 h-10">{game.description.substring(0, 70)}{game.description.length > 70 && '...'}</p>
        
        <div className="flex flex-wrap gap-1 mt-2">
            {(game.genres || []).slice(0, 2).map(genre => (
                <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0 mt-auto">
        <p className="text-xl font-bold text-accent">${game.price.toFixed(2)}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleWishlist(game)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={gameIsPurchased}
          >
            <Heart className={cn('h-5 w-5', isWishlisted ? 'fill-accent text-accent' : 'text-muted-foreground')} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleAddToCart(game)}
            aria-label="Add to cart"
            className="hover:bg-accent hover:text-accent-foreground"
            disabled={gameIsPurchased}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
