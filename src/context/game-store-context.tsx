'use client';

import type { Game } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

type GameStoreContextType = {
  cartItems: Game[];
  handleAddToCart: (game: Game) => void;
  removeFromCart: (gameId: string) => void;
  clearCart: () => void;
  wishlistItems: Game[];
  handleToggleWishlist: (game: Game) => void;
  isInWishlist: (gameId: string) => boolean;
  purchasedGames: Game[];
  isPurchased: (gameId: string) => boolean;
};

const GameStoreContext = createContext<GameStoreContextType | undefined>(undefined);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<Game[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Game[]>([]);
  const { user, firestore } = useFirebase();

  const libraryQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'library'));
  }, [user, firestore]);

  const { data: purchasedGames } = useCollection<Game>(libraryQuery);

  const handleAddToCart = useCallback((game: Game) => {
    setCartItems((prev) => {
      if (prev.find(item => item.id === game.id)) {
        setTimeout(() => {
            toast({
              title: "Already in Cart",
              description: `${game.title} is already in your shopping cart.`,
            });
        }, 0);
        return prev;
      }
      setTimeout(() => {
        toast({
          title: "Added to Cart",
          description: `${game.title} has been added to your cart.`,
        });
      }, 0);
      return [...prev, game];
    });
  }, [toast]);

  const removeFromCart = useCallback((gameId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== gameId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInWishlist = useCallback((gameId: string) => {
    return wishlistItems.some((item) => item.id === gameId);
  }, [wishlistItems]);

  const isPurchased = useCallback((gameId: string) => {
    return purchasedGames?.some((item) => item.id === gameId) ?? false;
  }, [purchasedGames]);

  const handleToggleWishlist = useCallback((game: Game) => {
    setWishlistItems((prev) => {
      const isWishlisted = prev.some((item) => item.id === game.id);
      if (isWishlisted) {
        setTimeout(() => {
            toast({
              description: `${game.title} removed from your wishlist.`,
            });
        }, 0);
        return prev.filter((item) => item.id !== game.id);
      } else {
        setTimeout(() => {
            toast({
              description: `${game.title} added to your wishlist.`,
            });
        }, 0);
        return [...prev, game];
      }
    });
  }, [toast]);

  return (
    <GameStoreContext.Provider
      value={{
        cartItems,
        handleAddToCart,
        removeFromCart,
        clearCart,
        wishlistItems,
        handleToggleWishlist,
        isInWishlist,
        purchasedGames: purchasedGames || [],
        isPurchased,
      }}
    >
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameStoreContext);
  if (context === undefined) {
    throw new Error('useGameStore must be used within a GameStoreProvider');
  }
  return context;
}
