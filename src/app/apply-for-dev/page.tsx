'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Code, Info, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useFirebase } from "@/firebase";
import { useGameStore } from "@/context/game-store-context";
import { useRole } from "@/hooks/useRole";
import type { Game } from "@/lib/types";

// Create a special "product" for the developer account upgrade
const devLicenseProduct: Game = {
    id: 'dev-account-upgrade',
    title: 'Licença de Desenvolvedor GameSphere',
    description: 'Desbloqueie a capacidade de publicar e vender os seus jogos na plataforma GameSphere.',
    longDescription: 'Ao adquirir esta licença, a sua conta será permanentemente atualizada para uma conta de Programador. Isto dar-lhe-á acesso ao Painel de Programador, onde poderá submeter os seus jogos para revisão, gerir as suas listagens e acompanhar as suas vendas. Junte-se à nossa comunidade de criadores e partilhe a sua visão com o mundo!',
    price: 10.00,
    genres: ['Utility'],
    coverImage: 'https://picsum.photos/seed/dev-license/600/800',
    screenshots: [],
    rating: 5,
    reviews: [],
};


export default function ApplyForDevPage() {
    const { user, isUserLoading } = useFirebase();
    const { role, isLoading: isRoleLoading } = useRole();
    const router = useRouter();
    const { handleAddToCart, isPurchased } = useGameStore();

    const handlePurchase = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        handleAddToCart(devLicenseProduct);
        router.push('/checkout');
    }
    
    const isLoading = isUserLoading || isRoleLoading;
    const hasLicense = isPurchased(devLicenseProduct.id);


    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <p>Carregando...</p>
                </main>
                <Footer />
            </div>
        );
    }

    if (role === 'admin' || role === 'dev' || hasLicense) {
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
                        <a href="/dev/dashboard">Ir para o Painel</a>
                    </Button>
                </main>
                <Footer />
            </div>
        )
    }
    
     if (!user && !isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <Info className="h-16 w-16 text-primary mb-4" />
                    <h1 className="text-3xl font-bold font-headline">Inicie Sessão para se Tornar um Desenvolvedor</h1>
                    <p className="mt-2 text-muted-foreground max-w-md">Para comprar a Licença de Programador, precisa de ter uma conta e iniciar sessão.</p>
                    <Button asChild className="mt-4">
                        <a href="/login">Login</a>
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
                <div className="container py-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <span className="inline-block px-3 py-1 text-sm font-semibold text-accent-foreground bg-accent rounded-full">Licença Única</span>
                            <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">Torne-se um Desenvolvedor GameSphere</h1>
                            <p className="text-lg text-muted-foreground">
                                Está pronto para partilhar os seus jogos com o mundo? Compre a Licença de Desenvolvedor para desbloquear o acesso ao nosso portal de submissão e comece a sua jornada como criador na GameSphere.
                            </p>
                            <div className="text-5xl font-bold text-primary pt-4">${devLicenseProduct.price.toFixed(2)}</div>
                             <Button size="lg" className="w-full md:w-auto" onClick={handlePurchase}>
                                <Rocket className="mr-2" /> Comprar Licença Agora
                            </Button>
                        </div>
                        <div>
                             <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8 rounded-lg aspect-square flex flex-col justify-center items-center text-center">
                                <Code className="h-24 w-24 text-primary" />
                                <h2 className="mt-6 text-2xl font-bold font-headline">O que está incluído?</h2>
                                <ul className="mt-4 text-muted-foreground list-disc list-inside text-left">
                                    <li>Acesso ao Painel de Desenvolvedor</li>
                                    <li>Submissão ilimitada de jogos</li>
                                    <li>Acompanhamento de estatísticas de vendas</li>
                                    <li>Pagamentos seguros</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
