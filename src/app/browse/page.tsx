import Link from "next/link";
import { GameCard } from "@/components/game-card";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { games } from "@/lib/data";
import { Search } from "lucide-react";


export default function BrowsePage({ searchParams }: { searchParams?: { q?: string } }) {
    const query = searchParams?.q || '';
    const filteredGames = games.filter(game => {
        const lowerCaseQuery = query.toLowerCase();
        return (
            game.title.toLowerCase().includes(lowerCaseQuery) ||
            game.description.toLowerCase().includes(lowerCaseQuery) ||
            game.genres.some(genre => genre.toLowerCase().includes(lowerCaseQuery))
        )
    });
    
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
                        {query ? `Results for "${query}"` : 'Browse All Games'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {query ? `Found ${filteredGames.length} games matching your search.` : 'Explore our full catalog of games.'}
                    </p>

                    {filteredGames.length > 0 ? (
                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredGames.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-16 flex flex-col items-center justify-center text-center">
                            <Search className="h-20 w-20 text-muted-foreground/50" />
                            <h2 className="mt-6 font-headline text-2xl font-bold">No Games Found</h2>
                            <p className="mt-2 text-muted-foreground">
                                We couldn't find any games matching "{query}".
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/browse">Clear Search</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
