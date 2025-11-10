'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Code, Info, Loader2, Rocket } from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { useGameStore } from "@/context/game-store-context";
import type { Game } from "@/lib/types";


export default function ApplyForDevPage() {
    const { user, isUserLoading, firestore } = useFirebase();
    const router = useRouter();
    const { handleAddToCart, isPurchased } = useGameStore();

    // The dev license is now a document in Firestore with a fixed ID
    const devLicenseRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'games', 'dev-account-upgrade');
    }, [firestore]);

    const { data: devLicenseProduct, isLoading: isLicenseLoading } = useDoc<Game>(devLicenseRef);

    const handlePurchase = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (devLicenseProduct) {
            // Explicitly create a Game object to ensure all fields are correctly typed and passed.
            const gameToAdd: Game = {
                id: devLicenseProduct.id,
                title: devLicenseProduct.title,
                description: devLicenseProduct.description,
                longDescription: devLicenseProduct.longDescription,
                price: devLicenseProduct.price,
                genres: devLicenseProduct.genres || [],
                coverImage: devLicenseProduct.coverImage,
                screenshots: devLicenseProduct.screenshots || [],
                rating: devLicenseProduct.rating || 0,
                reviews: devLicenseProduct.reviews || [],
            };
            handleAddToCart(gameToAdd);
            router.push('/checkout');
        }
    }
    
    const isLoading = isUserLoading || isLicenseLoading;
    const hasLicense = isPurchased('dev-account-upgrade');


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
                    <h1 className="text-3xl font-bold font-headline">Inicie Sessão para se Tornar um Desenvolvedor</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">Para comprar a Licença de Programador, precisa de ter uma conta e iniciar sessão.</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">Login</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        )
    }

    if (hasLicense) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <Rocket className="h-16 w-16 text-primary mb-4" />
                    <h1 className="text-3xl font-bold font-headline">Você já é um Desenvolvedor!</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">
                        A sua conta já tem privilégios de desenvolvedor. Visite o seu painel para começar a submeter jogos.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/dev/dashboard">Ir para o Painel</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        )
    }

    if (!devLicenseProduct) {
        return (
             <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <Info className="h-16 w-16 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold font-headline">Licença Indisponível</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">O produto da licença de desenvolvedor não está configurado. Por favor, contacte o suporte.</p>
                </main>
                <Footer />
            </div>
        )
    }


    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <span className="inline-block px-3 py-1 text-sm font-semibold text-accent-foreground bg-accent rounded-full">Licença Única</span>
                            <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">{devLicenseProduct.title}</h1>
                            <p className="text-lg text-muted-foreground">
                                {devLicenseProduct.longDescription}
                            </p>
                            <div className="text-5xl font-bold text-primary pt-4">${devLicenseProduct.price?.toFixed(2) || '0.00'}</div>
                             <Button size="lg" className="w-full md:w-auto" onClick={handlePurchase}>
                                <Rocket className="mr-2" /> Comprar Licença Agora
                            </Button>
                        </div>
                        <div>
                             <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8 rounded-lg aspect-square flex flex-col justify-center items-center text-center">
                                {devLicenseProduct.coverImage && (
                                    <Image 
                                        src={devLicenseProduct.coverImage} 
                                        alt={devLicenseProduct.title} 
                                        width={300}
                                        height={400}
                                        className="rounded-lg shadow-lg w-full h-auto object-contain" 
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
