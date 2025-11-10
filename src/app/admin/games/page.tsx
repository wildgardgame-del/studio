'use client';

import { collection, query, getDocs, writeBatch, doc, updateDoc, where } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Loader2, X } from 'lucide-react';
import type { Game } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

type GameWithId = Game & { id: string, status: 'pending' | 'approved' | 'rejected' };

export default function ManageGamesPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const fetchPendingGames = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const gamesRef = collection(firestore, 'games');
        const q = query(gamesRef, where("status", "==", "pending"));
        
        try {
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameWithId));
        } catch (error) {
            console.error("Error fetching pending games:", error);
            const permissionError = new FirestorePermissionError({
                path: 'games',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error fetching games',
                description: 'Could not fetch pending games. Check permissions.',
            });
            return [];
        }
    };
    
    const { data: pendingGames, isLoading, refetch } = useQuery({
        queryKey: ['pending-games'],
        queryFn: fetchPendingGames,
        enabled: !!firestore,
    });
    
    const handleApproval = async (gameId: string, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        
        const gameRef = doc(firestore, 'games', gameId);
        
        try {
            await updateDoc(gameRef, { status: newStatus });
            toast({
                title: `Game ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
                description: `The game's status has been updated.`,
            });
            refetch();
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: gameRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus },
              });
              errorEmitter.emit('permission-error', permissionError);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }
        
        if (!pendingGames || pendingGames.length === 0) {
            return <p className="text-center text-muted-foreground py-8">There are no pending games for review.</p>
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingGames.map(game => (
                        <TableRow key={game.id}>
                            <TableCell className="font-medium">{game.title}</TableCell>
                            <TableCell>${game.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleApproval(game.id, 'approved')}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleApproval(game.id, 'rejected')}>
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Game Submissions</h1>
                    <p className="text-muted-foreground mt-2">Approve or reject games submitted by developers.</p>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Pending Games for Review</CardTitle>
                            <CardDescription>These games have been submitted and are awaiting your approval.</CardDescription>
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
