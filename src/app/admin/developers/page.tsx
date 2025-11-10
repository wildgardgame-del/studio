'use client';

import { collection, query, getDocs, writeBatch, doc, updateDoc, collectionGroup } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
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

type ApplicationWithId = DeveloperApplication & { id: string };

export default function ManageDevelopersPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const fetchApplications = async () => {
        if (!firestore) throw new Error("Firestore not available");
        // This query is intentionally left to query a non-existent collection as the developer application
        // system has been removed.
        const q = query(collection(firestore, 'non_existent_collection_for_testing_rules'));
        
        try {
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApplicationWithId));
        } catch (error) {
            // Error handling is kept for robustness, but this part of the app is deprecated.
            console.error("This feature is deprecated. No applications to fetch.");
            return [];
        }
    };
    
    const { data: allApplications, isLoading, refetch } = useQuery({
        queryKey: ['all-developer-applications'],
        queryFn: fetchApplications,
        enabled: !!firestore,
    });
    
    const handleApproval = (application: ApplicationWithId, newStatus: 'approved' | 'rejected') => {
        toast({
            variant: 'destructive',
            title: 'Funcionalidade Descontinuada',
            description: 'A gestão de candidaturas de desenvolvedores foi removida.',
        });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }

        return <p className="text-center text-muted-foreground py-8">O sistema de candidatura de desenvolvedores foi descontinuado.</p>
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Gerenciar Desenvolvedores</h1>
                    <p className="text-muted-foreground mt-2">A funcionalidade de candidatura de desenvolvedores foi descontinuada. Gerencie as submissões de jogos diretamente.</p>
                    
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Candidaturas de Desenvolvedores</CardTitle>
                            <CardDescription>Esta secção está desativada. As candidaturas de desenvolvedores já não são utilizadas.</CardDescription>
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
