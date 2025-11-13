
'use client';

import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useState } from 'react';
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Admin } from '@/lib/types';

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
    const { firestore } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const fetchAllUsers = async () => {
        if (!firestore) throw new Error("Firestore not available");
        
        try {
            const usersRef = collection(firestore, 'users');
            const usersSnapshot = await getDocs(usersRef);
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            
            // Sort users on the client side
            users.sort((a, b) => {
                const dateA = a.registrationDate?.seconds || 0;
                const dateB = b.registrationDate?.seconds || 0;
                return dateB - dateA;
            });

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
    
    const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['all-users'],
        queryFn: fetchAllUsers,
        enabled: !!firestore,
    });

    const fetchAdminIds = async () => {
      if (!firestore) throw new Error("Firestore not available");
      try {
        const adminsSnapshot = await getDocs(collection(firestore, 'admins'));
        return adminsSnapshot.docs.map(doc => doc.id);
      } catch (error) {
        console.error("Error fetching admin IDs:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'admins', operation: 'list' }));
        return [];
      }
    };

    const { data: adminIds, isLoading: isLoadingAdmins } = useQuery({
        queryKey: ['admin-ids'],
        queryFn: fetchAdminIds,
        enabled: !!firestore,
    });
    
    const adminMutation = useMutation({
        mutationFn: async ({ user, makeAdmin }: { user: UserProfile, makeAdmin: boolean }) => {
            if (!firestore) throw new Error("Firestore not available");
            const adminDocRef = doc(firestore, 'admins', user.id);
            if (makeAdmin) {
                const adminData: Admin = { 
                    email: user.email, 
                    role: 'Admin', // Ensure this matches the security rule
                    addedAt: serverTimestamp() as any
                };
                await setDoc(adminDocRef, adminData);
            } else {
                await deleteDoc(adminDocRef);
            }
            return { user, makeAdmin };
        },
        onSuccess: ({ user, makeAdmin }) => {
            toast({
                title: "User Role Updated",
                description: `${user.username} is now ${makeAdmin ? 'an Admin' : 'a regular user'}.`,
            });
            queryClient.invalidateQueries({queryKey: ['admin-ids']});
        },
        onError: (error, { user, makeAdmin }) => {
            const permissionError = new FirestorePermissionError({
                path: `admins/${user.id}`,
                operation: makeAdmin ? 'create' : 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });

    const isUserAdmin = (userId: string) => {
        return adminIds?.includes(userId) ?? false;
    }
    
    const isLoading = isLoadingUsers || isLoadingAdmins;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Users</h1>
                            <p className="text-muted-foreground mt-2">View all registered users and manage their roles.</p>
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
                                        <TableHead>Role</TableHead>
                                        <TableHead>Registration Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                             <TableCell>
                                                {isUserAdmin(user.id) ? <Badge><ShieldCheck className="mr-1 h-3 w-3" /> Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                             </TableCell>
                                            <TableCell>
                                                {user.registrationDate 
                                                    ? format(new Date(user.registrationDate.seconds * 1000), 'PPP')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                {isUserAdmin(user.id) ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => adminMutation.mutate({ user, makeAdmin: false })}
                                                        disabled={adminMutation.isPending}
                                                    >
                                                        <ShieldOff className="mr-2 h-4 w-4" /> Demote
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => adminMutation.mutate({ user, makeAdmin: true })}
                                                        disabled={adminMutation.isPending}
                                                    >
                                                        <ShieldCheck className="mr-2 h-4 w-4" /> Promote to Admin
                                                    </Button>
                                                )
                                                }
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
