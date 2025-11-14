
'use client';

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useGameStore } from "@/context/game-store-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

function CheckoutPageContent() {
    const { cartItems, clearCart, removeFromWishlist } = useGameStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: user?.email || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "You are not logged in",
                description: "Please log in to complete your purchase.",
            });
            router.push('/login');
            return;
        }

        setIsProcessing(true);
        
        // Simulate payment processing
        setTimeout(async () => {
            try {
                const batch = writeBatch(firestore);

                // Add each purchased item's reference to the user's library
                // and remove it from their wishlist.
                cartItems.forEach(item => {
                    const libraryRef = doc(firestore, `users/${user.uid}/library`, item.id);
                    // Store a reference with a purchase date, not the full game object
                    batch.set(libraryRef, { 
                        gameId: item.id,
                        purchasedAt: serverTimestamp() 
                    });

                    // Also remove the game from the wishlist upon purchase
                    const wishlistRef = doc(firestore, `users/${user.uid}/wishlist`, item.id);
                    batch.delete(wishlistRef);
                });
                
                await batch.commit();

                clearCart();
                toast({
                    title: "Payment successful!",
                    description: "Your games are now available in your library.",
                });
                router.push('/library');

            } catch (error) {
                console.error("Error committing purchase to Firestore:", error);
                const permissionError = new FirestorePermissionError({
                    path: `users/${user.uid}/library`,
                    operation: 'write',
                    requestResourceData: { note: `Attempting to add ${cartItems.length} games to library.` }
                });
                
                errorEmitter.emit('permission-error', permissionError);
                
                toast({
                    variant: "destructive",
                    title: "Purchase Error",
                    description: "Could not save your purchase. Please check your permissions and try again.",
                });
            } finally {
                setIsProcessing(false);
            }
        }, 2000);
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
                            <CardDescription>Enter your email to receive your order confirmation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    
                                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                                    </Button>
                                </form>
                            </Form>
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
                            <div className="space-y-2 text-muted-foreground">
                                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Taxes</span><span>${tax.toFixed(2)}</span></div>
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
