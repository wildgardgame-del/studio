
'use client';

import { collection, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Eye, Loader2, X, Trash2, ShieldQuestion } from 'lucide-react';
import type { Game } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

type GameWithId = Game & { id: string, status: 'pending' | 'approved' | 'rejected' };

function ManageGamesPageContent() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [gameToDelete, setGameToDelete] = useState<GameWithId | null>(null);

    const fetchAllGames = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const gamesRef = collection(firestore, 'games');
        const q = query(gamesRef);
        
        try {
            const querySnapshot = await getDocs(q);
            const games = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameWithId));
            // Sort by status: pending first, then by title
            games.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return a.title.localeCompare(b.title);
            });
            return games;
        } catch (error) {
            console.error("Error fetching games:", error);
            const permissionError = new FirestorePermissionError({
                path: 'games',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error fetching games',
                description: 'Could not fetch games. Check permissions.',
            });
            return [];
        }
    };
    
    const { data: allGames, isLoading, isError } = useQuery({
        queryKey: ['all-games'],
        queryFn: fetchAllGames,
        enabled: !!firestore,
    });
    
    const statusMutation = useMutation({
        mutationFn: async ({ gameId, newStatus }: { gameId: string, newStatus: 'approved' | 'rejected' }) => {
            if (!firestore) throw new Error("Firestore not available");
            const gameRef = doc(firestore, 'games', gameId);
            await updateDoc(gameRef, { status: newStatus });
        },
        onSuccess: (_, variables) => {
            toast({
                title: `Game ${variables.newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
                description: `The game's status has been updated.`,
            });
            queryClient.invalidateQueries({ queryKey: ['all-games'] });
        },
        onError: (error, variables) => {
             const permissionError = new FirestorePermissionError({
                path: `games/${variables.gameId}`,
                operation: 'update',
                requestResourceData: { status: variables.newStatus },
              });
              errorEmitter.emit('permission-error', permissionError);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (gameId: string) => {
            if (!firestore) throw new Error("Firestore not available");
            const gameRef = doc(firestore, 'games', gameId);
            await deleteDoc(gameRef);
        },
        onSuccess: (_, gameId) => {
            toast({
                title: 'Game Deleted',
                description: 'The game has been permanently removed.',
            });
            queryClient.invalidateQueries({ queryKey: ['all-games'] });
        },
        onError: (error, gameId) => {
            console.error("Delete error", error);
            const permissionError = new FirestorePermissionError({
                path: `games/${gameId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setGameToDelete(null);
        }
    });

    const getStatusVariant = (status?: 'pending' | 'approved' | 'rejected') => {
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
        
        if (isError) {
             return <p className="text-center text-destructive py-8">An error occurred while loading games.</p>
        }
        
        if (!allGames || allGames.length === 0) {
            return <p className="text-center text-muted-foreground py-8">There are no games in the database.</p>
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allGames.map(game => (
                        <TableRow key={game.id} className={cn(game.status === 'pending' && 'bg-muted/40')}>
                            <TableCell className="font-medium">{game.title}</TableCell>
                            <TableCell>${game.price.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(game.status)} className={cn(
                                    game.status === 'approved' && 'bg-green-600',
                                )}>
                                    {game.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Unknown'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/games/${game.id}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> View
                                    </Link>
                                </Button>
                                {game.status === 'pending' && (
                                    <>
                                        <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => statusMutation.mutate({ gameId: game.id, newStatus: 'approved' })}>
                                            <Check className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => statusMutation.mutate({ gameId: game.id, newStatus: 'rejected' })}>
                                            <X className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                    </>
                                )}
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => setGameToDelete(game)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
        <>
            <AlertDialog open={!!gameToDelete} onOpenChange={(open) => !open && setGameToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the game <span className="font-bold">{gameToDelete?.title}</span> from the database. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => gameToDelete && deleteMutation.mutate(gameToDelete.id)}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete game
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 bg-secondary/30">
                    <div className="container py-12">
                        <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Games</h1>
                        <p className="text-muted-foreground mt-2">Review, approve, reject, and delete game submissions.</p>
                        
                        <Card className="mt-8">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>All Submitted Games</CardTitle>
                                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                                </div>
                                <CardDescription>Games pending review are highlighted.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderContent()}
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}

export default function ManageGamesPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ManageGamesPageContent />
        </Suspense>
    )
}
