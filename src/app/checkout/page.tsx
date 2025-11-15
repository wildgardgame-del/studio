
'use client';

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, collection } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useGameStore } from "@/context/game-store-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";

function CheckoutPageContent() {
    const { cartItems, clearCart } = useGameStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const total = subtotal;

    const handlePayment = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You are not logged in" });
            router.push('/login');
            return;
        }

        setIsProcessing(true);

        try {
            // Simulate calling a backend checkout API
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Checkout failed.');
            }

            const confirmation = await response.json();
            
            // On successful simulated payment, update Firestore
            const batch = writeBatch(firestore);
            const salesRef = collection(firestore, 'sales');

            cartItems.forEach(item => {
                const libraryRef = doc(firestore, `users/${user.uid}/library`, item.id);
                batch.set(libraryRef, { gameId: item.id, purchasedAt: serverTimestamp() });

                const saleRef = doc(salesRef);
                batch.set(saleRef, {
                    gameId: item.id,
                    userId: user.uid,
                    priceAtPurchase: item.price,
                    purchaseDate: serverTimestamp(),
                    txHash: confirmation.transactionId, // Use simulated transaction ID
                });

                const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, item.id);
                batch.delete(wishlistRef);
            });
            
            await batch.commit();

            clearCart();
            toast({
                title: "Purchase successful!",
                description: "Your games are now in your library.",
            });
            router.push('/library');

        } catch (error: any) {
            console.error("Payment error:", error);
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/library or sales`,
                operation: 'create',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: "destructive", title: "Purchase Error", description: error.message || "Could not complete your purchase." });
        } finally {
            setIsProcessing(false);
        }
    }
    
    if (cartItems.length === 0 && !isProcessing) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="font-headline text-2xl font-bold">Your cart is empty</h1>
                        <p className="text-muted-foreground mt-2">Add some games before you checkout.</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl text-center">Checkout</h1>
            <div className="mt-8 grid md:grid-cols-2 gap-12">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Confirm Purchase</CardTitle>
                            <CardDescription>
                               Review your order and confirm your purchase.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button onClick={handlePayment} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Image src={item.coverImage || `https://picsum.photos/seed/${item.id}/45/60`} alt={item.title} width={45} height={60} className="rounded-sm object-cover aspect-[3/4]" />
                                            <span className="truncate font-semibold">{item.title}</span>
                                        </div>
                                        <span>${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
