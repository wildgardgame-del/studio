
'use client';

import Link from 'next/link';
import { Frown } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 max-w-md w-full rounded-lg bg-secondary/50">
          <Frown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold font-headline mb-2">Payment Canceled</h1>
          <p className="text-muted-foreground mb-6">
            Your order was canceled. You have not been charged. Your cart has been saved if you'd like to try again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/checkout">Return to Checkout</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/browse">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
