'use client';

import type { Game } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type GameStoreContextType = {
  cartItems: Game[];
  handleAddToCart: (game: Game) => void;
  removeFromCart: (gameId: string) => void;
  clearCart: () => void;
  wishlistItems: Game[];
  handleToggleWishlist: (game: Game) => void;
  isInWishlist: (gameId: string) => boolean;
};

const GameStoreContext = createContext<GameStoreContextType | undefined>(undefined);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<Game[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Game[]>([]);

  const handleAddToCart = useCallback((game: Game) => {
    setCartItems((prev) => {
      if (prev.find(item => item.id === game.id)) {
        toast({
          title: "Already in Cart",
          description: `${game.title} is already in your shopping cart.`,
        });
        return prev;
      }
      toast({
        title: "Added to Cart",
        description: `${game.title} has been added to your cart.`,
      });
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

  const handleToggleWishlist = useCallback((game: Game) => {
    setWishlistItems((prev) => {
      const isWishlisted = prev.some((item) => item.id === game.id);
      if (isWishlisted) {
        toast({
          description: `${game.title} removed from your wishlist.`,
        });
        return prev.filter((item) => item.id !== game.id);
      } else {
        toast({
          description: `${game.title} added to your wishlist.`,
        });
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
