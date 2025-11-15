
'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Info, Loader2, ShoppingCart, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { useGameStore } from "@/context/game-store-context";
import type { Game } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { useToast } from "@/hooks/use-toast";

function ApplyForDevPageContent() {
    'use client';
    
    const { user, isUserLoading, firestore } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const { handleAddToCart, isPurchased } = useGameStore();

    const devLicenseRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'games', 'dev-account-upgrade');
    }, [firestore]);
    const { data: devLicenseProduct, isLoading: isLicenseLoading } = useDoc<Game>(devLicenseRef);

    const androidLicenseRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'games', 'dev-android-account-upgrade');
    }, [firestore]);
    const { data: androidLicenseProduct, isLoading: isAndroidLicenseLoading } = useDoc<Game>(androidLicenseRef);

    const handlePurchase = (product: Game | null) => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (product) {
            // Since the PC license is now free, we set its price to 0 before adding to cart
            const price = product.id === 'dev-account-upgrade' ? 0 : product.price;

            const gameToAdd: Game = {
                id: product.id,
                title: product.title,
                description: product.description,
                price: price,
                genres: product.genres || [],
                coverImage: product.coverImage,
                screenshots: product.screenshots || [],
                rating: product.rating || 0,
            };
            handleAddToCart(gameToAdd);
            router.push('/checkout');
        }
    }
    
    const isLoading = isUserLoading || isLicenseLoading || isAndroidLicenseLoading;
    const hasStandardLicense = isPurchased('dev-account-upgrade');
    const hasAndroidLicense = isPurchased('dev-android-account-upgrade');

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }
    
     if (!user && !isUserLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <Info className="h-16 w-16 text-primary mb-4" />
                    <h1 className="text-3xl font-bold font-headline">Log In to Become a Publisher</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">To purchase a Publisher License, you need to have an account and be logged in.</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">Login</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                 <div className="container py-16">
                    <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
                        <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">Become a Publisher</h1>
                        <p className="text-lg text-muted-foreground mt-4">
                            Choose the license that fits your needs and start publishing your games on our platform.
                        </p>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {devLicenseProduct ? (
                            <Card className="flex flex-col h-full border-primary/50 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-semibold text-primary-foreground bg-primary rounded-full">
                                    LIMITED TIME OFFER
                                </div>
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl">{devLicenseProduct.title}</CardTitle>
                                    <CardDescription>{devLicenseProduct.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-muted-foreground text-sm">{devLicenseProduct.longDescription}</p>
                                </CardContent>
                                <CardFooter className="flex-col sm:flex-row items-center gap-4 p-6 bg-secondary/30">
                                    <div className="text-4xl font-bold text-primary flex-1">
                                      <span className="text-muted-foreground line-through mr-4 text-3xl">${devLicenseProduct.price?.toFixed(2)}</span>
                                      <span>Free</span>
                                    </div>
                                    <Button size="lg" className="w-full sm:w-auto" onClick={() => handlePurchase(devLicenseProduct)} disabled={hasStandardLicense}>
                                        {hasStandardLicense ? <><CheckCircle2 className="mr-2" />Already Owned</> : <><ShoppingCart className="mr-2" /> Get License</>}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ) : <div className="border rounded-lg p-8 text-center text-muted-foreground">Standard License Unavailable</div>}

                        {androidLicenseProduct ? (
                            <Card className="flex flex-col h-full">
                                <CardHeader>
                                    <CardTitle className="font-headline text-2xl">{androidLicenseProduct.title}</CardTitle>
                                    <CardDescription>{androidLicenseProduct.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                <p className="text-muted-foreground text-sm">{androidLicenseProduct.longDescription}</p>
                                </CardContent>
                                <CardFooter className="flex-col sm:flex-row items-center gap-4 p-6 bg-secondary/30">
                                    <div className="text-4xl font-bold text-primary flex-1">${androidLicenseProduct.price?.toFixed(2) || '0.00'}</div>
                                    <Button size="lg" className="w-full sm:w-auto" onClick={() => handlePurchase(androidLicenseProduct)} disabled={hasAndroidLicense || true}>
                                        {hasAndroidLicense ? <><CheckCircle2 className="mr-2" />Already Owned</> : 'Coming Soon'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ) : <div className="border rounded-lg p-8 text-center text-muted-foreground">Android License Unavailable</div>}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default function ApplyForDevPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ApplyForDevPageContent />
        </Suspense>
    )
}
