
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
  removeFromWishlist: (gameId: string, silent?: boolean) => void;
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
  
  const removeFromWishlist = useCallback((gameId: string, silent: boolean = false) => {
    setWishlistItems((prev) => {
        const itemExists = prev.some(item => item.id === gameId);
        if (itemExists) {
            if (!silent) {
                 const game = prev.find(item => item.id === gameId);
                 if (game) {
                    setTimeout(() => {
                        toast({
                            description: `${game.title} removed from your wishlist.`,
                        });
                    }, 0);
                 }
            }
            return prev.filter((item) => item.id !== gameId);
        }
        return prev;
    });
}, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInWishlist = useCallback((gameId: string) => {
    return wishlistItems.some((item) => item.id === gameId);
  }, [wishlistItems]);

  const isPurchased = useCallback((gameId: string) => {
    // Also check if the dev license specifically is purchased
    if (gameId === 'dev-account-upgrade') {
        return purchasedGames?.some(item => item.id === 'dev-account-upgrade') ?? false;
    }
    return purchasedGames?.some((item) => item.id === gameId) ?? false;
  }, [purchasedGames]);

  const handleToggleWishlist = useCallback((game: Game) => {
    const isWishlisted = isInWishlist(game.id);
    if (isWishlisted) {
        removeFromWishlist(game.id);
    } else {
        setWishlistItems(prev => [...prev, game]);
        setTimeout(() => {
            toast({
                description: `${game.title} added to your wishlist.`,
            });
        }, 0);
    }
  }, [isInWishlist, removeFromWishlist, toast]);

  return (
    <GameStoreContext.Provider
      value={{
        cartItems,
        handleAddToCart,
        removeFromCart,
        clearCart,
        wishlistItems,
        handleToggleWishlist,
        removeFromWishlist,
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
