
'use client';

import Image from "next/image";
import { Loader2, Wallet } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp, collection } from "firebase/firestore";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useGameStore } from "@/context/game-store-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";

const RECIPIENT_ADDRESS = "0xYourWalletAddressHere"; // TODO: Replace with a real address

function CheckoutPageContent() {
    const { cartItems, clearCart } = useGameStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(browserProvider);
        }
    }, []);

    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const total = subtotal;

    const connectWallet = async () => {
        if (provider) {
            try {
                const accounts = await provider.send("eth_requestAccounts", []);
                if (accounts.length > 0) {
                    const walletSigner = await provider.getSigner();
                    setSigner(walletSigner);
                    toast({ title: "Wallet Connected", description: `Connected to: ${walletSigner.address.substring(0, 6)}...` });
                    return walletSigner;
                }
            } catch (error: any) {
                toast({ variant: "destructive", title: "Wallet Connection Failed", description: error.message });
            }
        } else {
            toast({ variant: "destructive", title: "MetaMask not found", description: "Please install MetaMask to use this feature." });
        }
        return null;
    };

    const handlePayment = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You are not logged in" });
            router.push('/login');
            return;
        }

        setIsProcessing(true);
        
        // Handle free checkout
        if (total <= 0) {
            try {
                const batch = writeBatch(firestore);
                cartItems.forEach(item => {
                    const libraryRef = doc(firestore, `users/${user.uid}/library`, item.id);
                    batch.set(libraryRef, { gameId: item.id, purchasedAt: serverTimestamp() });

                    const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, item.id);
                    batch.delete(wishlistRef);
                });

                await batch.commit();

                clearCart();
                toast({
                    title: "Success!",
                    description: "Your free games are now in your library.",
                });
                router.push('/library');
            } catch (error: any) {
                console.error("Free checkout error:", error);
                 toast({ variant: "destructive", title: "Error", description: "Could not add free games to your library." });
            } finally {
                setIsProcessing(false);
            }
            return;
        }
        
        // Handle paid checkout
        let currentSigner = signer;
        if (!currentSigner) {
            currentSigner = await connectWallet();
        }

        if (!currentSigner) {
            setIsProcessing(false); // Stop if wallet connection failed
            return;
        }

        try {
            const tx = await currentSigner.sendTransaction({
                to: RECIPIENT_ADDRESS,
                value: ethers.parseEther(total.toString()) 
            });

            toast({ title: "Transaction Sent!", description: "Processing your order..." });
            
            await tx.wait(1); // Wait for one confirmation

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
                    txHash: tx.hash
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
            if (error.code === 'ACTION_REJECTED') {
                 toast({ variant: "destructive", title: "Transaction Rejected", description: "You rejected the transaction in your wallet." });
            } else {
                 toast({ variant: "destructive", title: "Payment Error", description: error.message || "An unknown error occurred." });
            }
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
                                {total > 0
                                ? "Review your order and proceed to payment with your crypto wallet."
                                : "Confirm to add the free game(s) to your library."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button onClick={handlePayment} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {total > 0 && <Wallet className="mr-2 h-5 w-5" />}
                                {isProcessing 
                                    ? 'Processing...' 
                                    : total > 0 
                                        ? (signer ? `Pay ${total.toFixed(2)} with Crypto` : 'Connect Wallet & Pay')
                                        : 'Get Free Games'
                                }
                            </Button>
                            {total > 0 && (
                                <p className="text-xs text-muted-foreground mt-4 text-center">
                                    You will be prompted to connect your wallet and confirm the transaction.
                                </p>
                            )}
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
