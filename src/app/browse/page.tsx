'use client';

import Link from "next/link";
import { GameCard } from "@/components/game-card";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, documentId } from "firebase/firestore";
import type { Game } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { GameFilters } from "@/components/game-filters";

function BrowsePageContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    
    const { firestore } = useFirebase();
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState('newest');


    const gamesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query for all approved games, but specifically exclude the dev license product.
        return query(
            collection(firestore, "games"), 
            where("status", "==", "approved"),
            where(documentId(), "!=", "dev-account-upgrade")
        );
    }, [firestore]);

    const { data: approvedGames, isLoading } = useCollection<Game>(gamesQuery);

    const allGenres = useMemo(() => {
        if (!approvedGames) return [];
        const genresSet = new Set<string>();
        approvedGames.forEach(game => {
            game.genres.forEach(genre => genresSet.add(genre));
        });
        return Array.from(genresSet).sort();
    }, [approvedGames]);

    const filteredAndSortedGames = useMemo(() => {
        if (!approvedGames) return [];

        let games = approvedGames;

        // Text search filter
        if (q) {
            const lowerCaseQuery = q.toLowerCase();
            games = games.filter(game => 
                game.title.toLowerCase().includes(lowerCaseQuery) ||
                game.description.toLowerCase().includes(lowerCaseQuery) ||
                (game.genres && game.genres.some(genre => genre.toLowerCase().includes(lowerCaseQuery)))
            );
        }

        // Genre filter
        if (selectedGenres.length > 0) {
            games = games.filter(game => 
                selectedGenres.every(selectedGenre => game.genres.includes(selectedGenre))
            );
        }

        // Sorting
        games.sort((a, b) => {
            switch (sortOrder) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'newest':
                default:
                    // Assuming a 'submittedAt' field exists. If not, this needs adjustment.
                    const dateA = a.submittedAt?.seconds || 0;
                    const dateB = b.submittedAt?.seconds || 0;
                    return dateB - dateA;
            }
        });
        
        return games;
    }, [approvedGames, q, selectedGenres, sortOrder]);
    
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-12">
                    <div className="grid lg:grid-cols-4 gap-8">
                        <aside className="lg:col-span-1">
                           <GameFilters 
                                genres={allGenres}
                                selectedGenres={selectedGenres}
                                onGenreChange={setSelectedGenres}
                                sortOrder={sortOrder}
                                onSortOrderChange={setSortOrder}
                           />
                        </aside>
                        <div className="lg:col-span-3">
                            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
                                {q ? `Results for "${q}"` : 'Browse All Games'}
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {isLoading 
                                    ? 'Searching for games...' 
                                    : q 
                                        ? `Found ${filteredAndSortedGames.length} games matching your search.` 
                                        : 'Explore our full catalog of games.'}
                            </p>

                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                </div>
                            ) : filteredAndSortedGames.length > 0 ? (
                                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                    {filteredAndSortedGames.map((game) => (
                                        <GameCard key={game.id} game={game} />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-16 flex flex-col items-center justify-center text-center bg-secondary/30 rounded-lg py-16">
                                    <Search className="h-20 w-20 text-muted-foreground/50" />
                                    <h2 className="mt-6 font-headline text-2xl font-bold">{q ? 'No Games Found' : 'The Store is Empty'}</h2>
                                    <p className="mt-2 text-muted-foreground max-w-sm">
                                        {q ? `We couldn't find any games matching "${q}". Try adjusting your filters.` : 'Check back later for new games!'}
                                    </p>
                                    {q && (
                                        <Button asChild className="mt-6">
                                            <Link href="/browse">Clear Search</Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}


export default function BrowsePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <BrowsePageContent />
        </Suspense>
    )
}