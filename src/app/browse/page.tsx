
'use client';

import Link from "next/link";
import { GameCard } from "@/components/game-card";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, documentId, getDoc, doc } from "firebase/firestore";
import type { Game } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import { GameFilters } from "@/components/game-filters";
import { availableGenres } from "@/lib/genres";

const ADULT_CONTENT_STORAGE_KEY = 'gamesphere-show-adult-content';

function BrowsePageContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState('newest');
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [isUserCheckLoading, setIsUserCheckLoading] = useState(true);
    const [showAdultContent, setShowAdultContent] = useState(false);

    // Effect to check user's age verification status from Firestore
    useEffect(() => {
        const checkUserAgeVerification = async () => {
            setIsUserCheckLoading(true);
            if (user && firestore) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                const isVerified = userDoc.exists() && userDoc.data().isAgeVerified;
                setIsAgeVerified(isVerified);

                // Load user's preference from localStorage only if they are age-verified
                if (isVerified) {
                    const storedPreference = localStorage.getItem(ADULT_CONTENT_STORAGE_KEY);
                    // Default to false (hiding content) for verified users if no preference is stored
                    setShowAdultContent(storedPreference !== null ? JSON.parse(storedPreference) : false);
                } else {
                    setShowAdultContent(false);
                }
            } else {
                // For guests, they are not age-verified and cannot see adult content.
                setIsAgeVerified(false);
                setShowAdultContent(false);
            }
            setIsUserCheckLoading(false);
        };

        checkUserAgeVerification();
    }, [user, firestore]);

    // Effect to save the user's preference to localStorage whenever it changes
    useEffect(() => {
        // Only save the preference if the user is age-verified.
        if (isAgeVerified) {
            localStorage.setItem(ADULT_CONTENT_STORAGE_KEY, JSON.stringify(showAdultContent));
        }
    }, [showAdultContent, isAgeVerified]);

    const gamesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        let q = query(
            collection(firestore, "games"), 
            where("status", "==", "approved"),
            where(documentId(), "!=", "dev-account-upgrade")
        );

        return q;
    }, [firestore]);

    const { data: approvedGames, isLoading: areGamesLoading } = useCollection<Game>(gamesQuery);

    const filteredAndSortedGames = useMemo(() => {
        if (!approvedGames) return [];

        let games = approvedGames;
        
        // Filter by adult content based on verification and preference
        if (!isAgeVerified || !showAdultContent) {
            // If user is NOT age verified, OR they are but have the toggle OFF,
            // filter out adult content.
            // A game is considered non-adult if isAdultContent is false OR not defined.
            games = games.filter(game => !game.isAdultContent);
        }
        // If user is age verified AND has the toggle ON, no filtering is needed here.

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
                game.genres && selectedGenres.every(selectedGenre => game.genres.includes(selectedGenre))
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
                    const dateA = a.submittedAt?.seconds || 0;
                    const dateB = b.submittedAt?.seconds || 0;
                    return dateB - dateA;
            }
        });
        
        return games;
    }, [approvedGames, q, selectedGenres, sortOrder, isAgeVerified, showAdultContent]);
    
    const isLoading = areGamesLoading || isUserCheckLoading;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-12">
                    <div className="grid lg:grid-cols-4 gap-8">
                        <aside className="lg:col-span-1">
                           <GameFilters 
                                genres={availableGenres as unknown as string[]}
                                selectedGenres={selectedGenres}
                                onGenreChange={setSelectedGenres}
                                sortOrder={sortOrder}
                                onSortOrderChange={setSortOrder}
                                isAgeVerified={isAgeVerified}
                                showAdultContent={showAdultContent}
                                onShowAdultContentChange={setShowAdultContent}
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
