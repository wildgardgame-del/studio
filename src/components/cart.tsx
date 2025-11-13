'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { useGameStore } from '@/context/game-store-context';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export function Cart({ children }: { children: ReactNode }) {
  const { cartItems, removeFromCart, clearCart } = useGameStore();

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Shopping Cart ({cartItems.length})</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={item.coverImage || `https://picsum.photos/seed/${item.id}/64/80`}
                      alt={item.title}
                      width={64}
                      height={80}
                      className="rounded-md object-cover aspect-[3/4]"
                    />
                    <div className="flex-1">
                      <Link href={`/games/${item.id}`} className="font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <p className="text-muted-foreground">${(item.price || 0).toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="px-6 py-4 bg-secondary/50">
              <div className="w-full space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link href="/checkout">Go to Checkout</Link>
                    </Button>
                  </SheetClose>
                   <Button variant="outline" onClick={clearCart}>
                      Clear Cart
                    </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <h3 className="font-headline text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">Looks like you haven't added any games yet.</p>
            <SheetClose asChild>
                <Button asChild variant="outline">
                    <Link href="/browse">Start Browsing</Link>
                </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
