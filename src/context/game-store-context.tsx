'use client';

import type { Game } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
  const { user, firestore } = useFirebase();

  // --- Purchased Games Logic ---
  const libraryQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'library'));
  }, [user, firestore]);
  const { data: purchasedGames } = useCollection<Game>(libraryQuery);
  
  // --- Wishlist Logic ---
  const wishlistQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/wishlist`);
  }, [user, firestore]);
  const { data: wishlistItems } = useCollection<Game>(wishlistQuery);

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
    return wishlistItems?.some((item) => item.id === gameId) ?? false;
  }, [wishlistItems]);

  const isPurchased = useCallback((gameId: string) => {
    return purchasedGames?.some((item) => item.id === gameId) ?? false;
  }, [purchasedGames]);

  const handleToggleWishlist = useCallback(async (game: Game) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You need to be logged in to manage your wishlist.' });
        return;
    }

    const isWishlisted = isInWishlist(game.id);
    const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, game.id);

    if (isWishlisted) {
        try {
            await deleteDoc(wishlistRef);
            toast({
                description: `${game.title} removed from your wishlist.`,
            });
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove item from wishlist.' });
        }
    } else {
        try {
            await setDoc(wishlistRef, game);
            toast({
                description: `${game.title} added to your wishlist.`,
            });
        } catch (error) {
             console.error("Error adding to wishlist:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not add item to wishlist.' });
        }
    }
  }, [user, firestore, isInWishlist, toast]);

  const removeFromWishlist = useCallback(async (gameId: string, silent: boolean = false) => {
    if (!user || !firestore) return;
    
    const isWishlisted = isInWishlist(gameId);
    if (isWishlisted) {
        const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, gameId);
        try {
            await deleteDoc(wishlistRef);
            if (!silent && wishlistItems) {
                const game = wishlistItems.find(item => item.id === gameId);
                if (game) {
                    toast({
                        description: `${game.title} removed from your wishlist.`,
                    });
                }
            }
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            if (!silent) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not remove item from wishlist.' });
            }
        }
    }
  }, [user, firestore, isInWishlist, toast, wishlistItems]);

  return (
    <GameStoreContext.Provider
      value={{
        cartItems,
        handleAddToCart,
        removeFromCart,
        clearCart,
        wishlistItems: wishlistItems || [],
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
