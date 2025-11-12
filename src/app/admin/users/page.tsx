'use client';

import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense } from 'react';
import { Loader2 } "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type UserProfile = {
    id: string;
    username: string;
    email: string;
    registrationDate: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

function ManageUsersPageContent() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const fetchAllUsers = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, orderBy('registrationDate', 'desc'));
        
        try {
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            const permissionError = new FirestorePermissionError({
                path: 'users',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error fetching users',
                description: 'Could not fetch users. Check admin permissions.',
            });
            return [];
        }
    };
    
    const { data: allUsers, isLoading } = useQuery({
        queryKey: ['all-users'],
        queryFn: fetchAllUsers,
        enabled: !!firestore,
    });

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Users</h1>
                            <p className="text-muted-foreground mt-2">View and manage all registered users.</p>
                        </div>
                        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    </div>
                    
                    <Card className="mt-8">
                       <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>A list of all users in the system.</CardDescription>
                       </CardHeader>
                       <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            ) : !allUsers || allUsers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No users found.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Registration Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    {user.registrationDate 
                                                        ? format(new Date(user.registrationDate.seconds * 1000), 'PPP')
                                                        : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                       </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function ManageUsersPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ManageUsersPageContent />
        </Suspense>
    )
}
