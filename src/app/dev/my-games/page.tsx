
'use client';

import { Suspense } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Pencil, Info, ArrowLeft } from 'lucide-react';
import type { Game } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


type GameWithId = Game & { id: string };

function MyGamesPageContent() {
    const { firestore, user } = useFirebase();

    const myGamesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'games'), where("developerId", "==", user.uid));
    }, [firestore, user]);
    
    const { data: myGames, isLoading } = useCollection<GameWithId>(myGamesQuery);
    
    const getStatusVariant = (status: 'pending' | 'approved' | 'rejected' | undefined) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }
        
        if (!myGames || myGames.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    <p>You haven't submitted any games yet.</p>
                     <Button asChild className="mt-4">
                        <Link href="/dev/submit">
                           <PlusCircle className="mr-2 h-4 w-4" /> Submit Your First Game
                        </Link>
                    </Button>
                </div>
            )
        }

        return (
            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Game</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myGames.map(game => (
                            <TableRow key={game.id}>
                                <TableCell className="font-medium">{game.title}</TableCell>
                                <TableCell>${game.price ? game.price.toFixed(2) : '0.00'}</TableCell>
                                <TableCell className="text-center">
                                    {(game.status === 'rejected' || (game.status === 'pending' && game.rejectionReason)) && game.rejectionReason ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant={getStatusVariant(game.status)} className="cursor-help">
                                                    <Info className="mr-1 h-3 w-3" />
                                                     {game.status === 'rejected' ? 'Rejected' : 'Revision Requested'}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{game.rejectionReason}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Badge variant={getStatusVariant(game.status)} className={cn(
                                            game.status === 'approved' && 'bg-green-600',
                                        )}>
                                            {game.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Unknown'}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-block"> {/* Wrapper div for Tooltip with disabled button */}
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={game.status === 'pending' && !game.rejectionReason}
                                                    style={{ pointerEvents: game.status === 'pending' && !game.rejectionReason ? 'none' : 'auto' }} // Explicitly disable pointer events
                                                >
                                                     <Link href={`/dev/edit/${game.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {(game.status === 'pending' && !game.rejectionReason) && (
                                            <TooltipContent>
                                                <p>Cannot edit a game while it's under review.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TooltipProvider>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">My Submitted Games</h1>
                    <p className="text-muted-foreground mt-2">Track the review status and edit your games.</p>
                     <Button asChild variant="link" className="p-0 text-accent mt-2">
                        <Link href="/dev/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Submission History</CardTitle>
                            <CardDescription>Here are all the games you've submitted to GameSphere.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderContent()}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function MyGamesPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <MyGamesPageContent />
        </Suspense>
    )
}
