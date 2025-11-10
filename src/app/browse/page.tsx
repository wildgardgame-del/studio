'use client';

import Link from "next/link";
import { GameCard } from "@/components/game-card";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Game } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function BrowsePage() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    
    const { firestore } = useFirebase();

    const gamesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "games"), where("status", "==", "approved"));
    }, [firestore]);

    const { data: approvedGames, isLoading } = useCollection<Game>(gamesQuery);

    const filteredGames = useMemo(() => {
        if (!approvedGames) return [];
        if (!q) return approvedGames;

        const lowerCaseQuery = q.toLowerCase();
        return approvedGames.filter(game => 
            game.title.toLowerCase().includes(lowerCaseQuery) ||
            game.description.toLowerCase().includes(lowerCaseQuery) ||
            (game.genres && game.genres.some(genre => genre.toLowerCase().includes(lowerCaseQuery)))
        );
    }, [approvedGames, q]);
    
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
                        {q ? `Results for "${q}"` : 'Browse All Games'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {isLoading 
                            ? 'Searching for games...' 
                            : q 
                                ? `Found ${filteredGames.length} games matching your search.` 
                                : 'Explore our full catalog of games.'}
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        </div>
                    ) : filteredGames.length > 0 ? (
                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredGames.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-16 flex flex-col items-center justify-center text-center">
                            <Search className="h-20 w-20 text-muted-foreground/50" />
                            <h2 className="mt-6 font-headline text-2xl font-bold">{q ? 'No Games Found' : 'The Store is Empty'}</h2>
                            <p className="mt-2 text-muted-foreground">
                                {q ? `We couldn't find any games matching "${q}".` : 'Check back later for new games!'}
                            </p>
                            {q && (
                                <Button asChild className="mt-6">
                                    <Link href="/browse">Clear Search</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
