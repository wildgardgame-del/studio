
'use client';

import { collection, query, getDocs, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eye, Loader2, X, Trash2, ShieldQuestion } from 'lucide-react';
import type { Game } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type GameWithId = Game & { id: string, status: 'pending' | 'approved' | 'rejected' };

type GameAction = {
    id: string;
    title: string;
    developerId?: string;
}

function ManageGamesPageContent() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [gameToDelete, setGameToDelete] = useState<GameAction | null>(null);
    const [gameToReject, setGameToReject] = useState<GameAction | null>(null);
    const [gameForRevision, setGameForRevision] = useState<GameAction | null>(null);

    const [actionReason, setActionReason] = useState("");

    const fetchAllGames = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const gamesRef = collection(firestore, 'games');
        const q = query(gamesRef);
        
        try {
            const querySnapshot = await getDocs(q);
            const games = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameWithId));
            games.sort((a, b) => a.title.localeCompare(b.title));
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

    const pendingGames = useMemo(() => allGames?.filter(g => g.status === 'pending') || [], [allGames]);
    const approvedGames = useMemo(() => allGames?.filter(g => g.status === 'approved') || [], [allGames]);
    const rejectedGames = useMemo(() => allGames?.filter(g => g.status === 'rejected') || [], [allGames]);

    const createNotification = (game: GameAction, title: string, message: string) => {
        if (!firestore || !game.developerId) return;
        const notificationsRef = collection(firestore, `users/${game.developerId}/notifications`);
        const notificationData = {
            userId: game.developerId,
            title: title,
            message: message,
            isRead: false,
            createdAt: serverTimestamp(),
            type: 'game-status',
            link: '/dev/my-games'
        };
        addDocumentNonBlocking(notificationsRef, notificationData);
    };
    
    const statusMutation = useMutation({
        mutationFn: async ({ game, newStatus, reason }: { game: GameAction, newStatus: 'approved' | 'rejected' | 'pending', reason?: string }) => {
            if (!firestore) throw new Error("Firestore not available");
            const gameRef = doc(firestore, 'games', game.id);
            const updateData: { status: 'approved' | 'rejected' | 'pending', rejectionReason?: string | null } = { status: newStatus, rejectionReason: null };
            if (reason) {
                updateData.rejectionReason = reason;
            }
            await updateDoc(gameRef, updateData);
            return { game, newStatus, reason }; // Pass context to onSuccess
        },
        onSuccess: ({ game, newStatus, reason }) => {
            let title = 'Game Status Updated';
            let notificationTitle = '';
            let notificationMessage = '';
            
            if (newStatus === 'approved') {
                title = 'Game Approved';
                notificationTitle = `Game Approved: ${game.title}`;
                notificationMessage = `Congratulations! Your game, ${game.title}, has been approved and is now live on the store.`;
            }
            if (newStatus === 'rejected') {
                title = 'Game Rejected';
                notificationTitle = `Submission Rejected: ${game.title}`;
                notificationMessage = `Your submission for ${game.title} was rejected. Reason: ${reason}`;
            }
            if (newStatus === 'pending') {
                title = 'Revision Requested';
                notificationTitle = `Revision Requested for ${game.title}`;
                notificationMessage = `A revision has been requested for your game, ${game.title}. Reason: ${reason}`;
            }

            createNotification(game, notificationTitle, notificationMessage);
            
            toast({
                title: title,
                description: `The game's status has been updated. A notification was sent to the developer.`,
            });
            queryClient.invalidateQueries({ queryKey: ['all-games'] });
        },
        onError: (error, variables) => {
             const permissionError = new FirestorePermissionError({
                path: `games/${variables.game.id}`,
                operation: 'update',
                requestResourceData: { status: variables.newStatus },
              });
              errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setGameToReject(null);
            setGameForRevision(null);
            setActionReason("");
        }
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

    const handleActionSubmit = (action: 'reject' | 'request-revision') => {
        const game = action === 'reject' ? gameToReject : gameForRevision;
        if (!game || actionReason.trim() === '') {
            toast({
                variant: 'destructive',
                title: 'Reason required',
                description: 'Please provide a reason for this action.',
            });
            return;
        }

        const newStatus = action === 'reject' ? 'rejected' : 'pending';
        statusMutation.mutate({ game, newStatus: newStatus, reason: actionReason });
    };
    
    const GameTable = ({ games, status }: { games: GameWithId[], status: 'pending' | 'approved' | 'rejected' | 'all' }) => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }

        if (!games || games.length === 0) {
            return <p className="text-center text-muted-foreground py-8">There are no {status !== 'all' ? status : ''} games.</p>
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
                    {games.map(game => (
                        <TableRow key={game.id}>
                            <TableCell className="font-medium">{game.title}</TableCell>
                            <TableCell>${game.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/games/${game.id}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> View
                                    </Link>
                                </Button>
                                {status === 'pending' && (
                                    <>
                                        <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => statusMutation.mutate({ game, newStatus: 'approved' })}>
                                            <Check className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setGameToReject({ id: game.id, title: game.title, developerId: game.developerId })}>
                                            <X className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                    </>
                                )}
                                {status === 'approved' && (
                                     <Button size="sm" variant="ghost" className="text-yellow-500 hover:text-yellow-600" onClick={() => setGameForRevision({ id: game.id, title: game.title, developerId: game.developerId })}>
                                        <ShieldQuestion className="mr-2 h-4 w-4" /> Request Revision
                                    </Button>
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
            {/* Delete Dialog */}
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
            
            {/* Reject Dialog */}
            <AlertDialog open={!!gameToReject} onOpenChange={(open) => !open && setGameToReject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Reject Submission: {gameToReject?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please provide a reason for rejecting this submission. This will be visible to the developer.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea
                            id="rejection-reason"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="e.g., The game does not meet our quality standards due to..."
                        />
                        </div>
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setActionReason("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleActionSubmit('reject')}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={statusMutation.isPending}
                    >
                        {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Request Revision Dialog */}
            <AlertDialog open={!!gameForRevision} onOpenChange={(open) => !open && setGameForRevision(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Request Revision for: {gameForRevision?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Provide a reason for requesting a revision. The game's status will be set to 'Pending' and it will be removed from the public store until resubmitted and re-approved.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                        <Label htmlFor="revision-reason">Reason for Revision</Label>
                        <Textarea
                            id="revision-reason"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="e.g., A critical bug was found that breaks the main quest..."
                        />
                        </div>
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setActionReason("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleActionSubmit('request-revision')}
                        disabled={statusMutation.isPending}
                    >
                        {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Request Revision
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 bg-secondary/30">
                    <div className="container py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Games</h1>
                                <p className="text-muted-foreground mt-2">Review, approve, reject, and delete game submissions.</p>
                            </div>
                            {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                        </div>
                        
                        <Card className="mt-8">
                           <CardContent className="p-0">
                                <Tabs defaultValue="pending">
                                    <TabsList className="m-4">
                                        <TabsTrigger value="pending">
                                            Pending <Badge variant="secondary" className="ml-2">{pendingGames.length}</Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="approved">
                                            Approved <Badge variant="secondary" className="ml-2">{approvedGames.length}</Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="rejected">
                                            Rejected <Badge variant="secondary" className="ml-2">{rejectedGames.length}</Badge>
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="pending" className="m-0">
                                        <GameTable games={pendingGames} status="pending" />
                                    </TabsContent>
                                    <TabsContent value="approved">
                                        <GameTable games={approvedGames} status="approved" />
                                    </TabsContent>
                                    <TabsContent value="rejected">
                                        <GameTable games={rejectedGames} status="rejected" />
                                    </TabsContent>
                                </Tabs>
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
