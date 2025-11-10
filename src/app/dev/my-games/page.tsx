
'use client';

import { collection, query, where } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle } from 'lucide-react';
import type { Game } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type GameWithId = Game & { id: string };

export default function MyGamesPage() {
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
                    <p>Você ainda não submeteu nenhum jogo.</p>
                     <Button asChild className="mt-4">
                        <Link href="/dev/submit">
                           <PlusCircle className="mr-2 h-4 w-4" /> Submeter Primeiro Jogo
                        </Link>
                    </Button>
                </div>
            )
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Jogo</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {myGames.map(game => (
                        <TableRow key={game.id}>
                            <TableCell className="font-medium">{game.title}</TableCell>
                            <TableCell>${game.price ? game.price.toFixed(2) : '0.00'}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={getStatusVariant(game.status)} className={cn(
                                    game.status === 'approved' && 'bg-green-600',
                                )}>
                                    {game.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Unknown'}
                                </Badge>
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
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Meus Jogos Submetidos</h1>
                    <p className="text-muted-foreground mt-2">Acompanhe o status de revisão dos seus jogos.</p>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Histórico de Submissões</CardTitle>
                            <CardDescription>Aqui estão todos os jogos que você submeteu para a GameSphere.</CardDescription>
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
