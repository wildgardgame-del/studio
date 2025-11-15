
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Stripe from 'stripe';
import { doc, writeBatch, serverTimestamp, getDocs, collection, query, where, documentId } from 'firebase/firestore';

import { useGameStore } from '@/context/game-store-context';
import { useFirebase } from '@/firebase';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Game } from '@/lib/types';


async function verifySession(sessionId: string) {
    const response = await fetch('/api/checkout/verify-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Session verification failed.');
    }
    return response.json();
}


function CheckoutSuccessPageContent() {
    const { firestore } = useFirebase();
    const { clearCart, removeFromWishlist } = useGameStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!sessionId) {
            router.push('/');
            return;
        }

        async function processPurchase() {
            try {
                const { session } = await verifySession(sessionId as string) as { session: Stripe.Checkout.Session };
                
                if (session.payment_status === 'paid' && firestore) {
                    setMessage('Payment successful! Updating your library...');
                    
                    const userId = session.metadata?.userId;
                    const gamePricesString = session.metadata?.gamePrices;
                    
                    if (!userId || !gamePricesString) {
                        throw new Error('Required metadata missing from session.');
                    }
                    
                    const gamePrices: { id: string, price: number }[] = JSON.parse(gamePricesString);
                    
                    // Firestore batch write
                    const batch = writeBatch(firestore);
                    
                    gamePrices.forEach(gameInfo => {
                        // 1. Add game to user's library
                        const libraryRef = doc(firestore, `users/${userId}/library`, gameInfo.id);
                        batch.set(libraryRef, { purchasedAt: serverTimestamp() });
                        
                        // 2. Create a sale record for analytics
                        const saleRef = doc(collection(firestore, 'sales'));
                        batch.set(saleRef, {
                            userId: userId,
                            gameId: gameInfo.id,
                            priceAtPurchase: gameInfo.price,
                            purchaseDate: serverTimestamp()
                        });

                        // 3. Remove from wishlist if present
                        removeFromWishlist(gameInfo.id, true); // silent removal
                    });
                    
                    await batch.commit();

                    clearCart();
                    setStatus('success');
                    setMessage('Your purchase is complete! The games have been added to your library.');
                } else {
                    throw new Error('Payment was not successful or is still processing.');
                }
            } catch (error: any) {
                console.error("Purchase processing error:", error);
                setStatus('error');
                setMessage(error.message || 'There was a problem processing your purchase. Please contact support.');
            }
        }
        
        processPurchase();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, firestore, clearCart, router, removeFromWishlist]);


    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 max-w-md w-full rounded-lg bg-secondary/50">
                    {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />}
                    {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />}
                    {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />}
                    
                    <h1 className="text-2xl font-bold font-headline mb-2">
                        {status === 'loading' && 'Processing Purchase'}
                        {status === 'success' && 'Purchase Complete!'}
                        {status === 'error' && 'An Error Occurred'}
                    </h1>

                    <p className="text-muted-foreground mb-6">{message}</p>
                    
                    {status === 'success' && (
                         <Button asChild>
                            <Link href="/library">Go to Your Library</Link>
                        </Button>
                    )}
                     {status === 'error' && (
                         <Button asChild variant="secondary">
                            <Link href="/browse">Back to Store</Link>
                        </Button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <CheckoutSuccessPageContent />
        </Suspense>
    )
}
