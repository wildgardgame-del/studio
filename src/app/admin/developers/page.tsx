'use client';

import { collection, query, getDocs, writeBatch, doc, updateDoc, collectionGroup } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Loader2, X } from 'lucide-react';
import type { DeveloperApplication } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type ApplicationWithId = DeveloperApplication & { id: string };

export default function ManageDevelopersPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const fetchApplications = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const q = query(collectionGroup(firestore, 'developer_applications'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationWithId));
    };
    
    const { data: allApplications, isLoading, refetch } = useQuery({
        queryKey: ['all-developer-applications'],
        queryFn: fetchApplications,
        enabled: !!firestore,
    });
    
    const handleApproval = async (application: ApplicationWithId, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;

        const appRef = doc(firestore, `users/${application.userId}/developer_applications`, application.id);
        const userRef = doc(firestore, 'users', application.userId);

        try {
            if (newStatus === 'approved') {
                const batch = writeBatch(firestore);
                batch.update(appRef, { status: newStatus });
                batch.update(userRef, { role: 'dev' });
                await batch.commit();
            } else {
                 await updateDoc(appRef, { status: newStatus });
            }

            toast({
                title: 'Sucesso!',
                description: `A candidatura de ${application.developerName} foi ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'}.`,
            });
            refetch();
        } catch (error: any) {
             // Handle potential permission errors for each operation
            if (error.code === 'permission-denied') {
                const appUpdateError = new FirestorePermissionError({
                    path: appRef.path,
                    operation: 'update',
                    requestResourceData: { status: newStatus },
                });
                errorEmitter.emit('permission-error', appUpdateError);

                if (newStatus === 'approved') {
                    const roleUpdateError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'update',
                        requestResourceData: { role: 'dev' },
                    });
                    errorEmitter.emit('permission-error', roleUpdateError);
                }
            }
            console.error('Error updating application status:', error);
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: `Não foi possível atualizar a candidatura. Detalhes: ${error.message}`,
            });
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

        if (!allApplications || allApplications.length === 0) {
            return <p className="text-center text-muted-foreground py-8">Não foi encontrada nenhuma candidatura.</p>
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome do Desenvolvedor</TableHead>
                        <TableHead>Data de Submissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allApplications.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.developerName}</TableCell>
                            <TableCell>{app.submittedAt ? new Date(app.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={
                                        app.status === 'pending' ? 'secondary' : 
                                        app.status === 'approved' ? 'default' : 'destructive'
                                    }
                                >
                                    {app.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleApproval(app, 'approved')} disabled={app.status === 'approved'}>
                                    <Check className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleApproval(app, 'rejected')} disabled={app.status === 'rejected'}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Gerenciar Desenvolvedores</h1>
                    <p className="text-muted-foreground mt-2">Aprove ou rejeite novas candidaturas de desenvolvedores.</p>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Todas as Candidaturas</CardTitle>
                            <CardDescription>Reveja todas as candidaturas submetidas e tome uma ação.</CardDescription>
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
