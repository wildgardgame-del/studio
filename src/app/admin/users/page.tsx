
'use client';

import { collection, query, getDocs, orderBy, doc, deleteDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useState, useMemo } from 'react';
import { Loader2, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
    isAdmin: boolean;
}

function ManageUsersPageContent() {
    const { firestore, user: adminUser } = useFirebase();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const [userToToggleAdmin, setUserToToggleAdmin] = useState<{user: UserProfile, makeAdmin: boolean} | null>(null);

    const fetchAdminIds = async () => {
        if (!firestore) return [];
        try {
            const adminSnapshot = await getDocs(collection(firestore, 'admins'));
            return adminSnapshot.docs.map(doc => doc.id);
        } catch (error) {
            console.error("Error fetching admin IDs:", error);
            const permissionError = new FirestorePermissionError({ path: 'admins', operation: 'list' });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error fetching admin roles' });
            return [];
        }
    }

    const fetchAllUsers = async (adminIds: string[]) => {
        if (!firestore) throw new Error("Firestore not available");
        
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, orderBy('registrationDate', 'desc'));
            const usersSnapshot = await getDocs(q);
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<UserProfile, 'isAdmin'>));

            return users.map(user => ({ ...user, isAdmin: adminIds.includes(user.id) }));

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
    
    const { data: adminIds, isLoading: isAdminIdsLoading } = useQuery({
        queryKey: ['admin-ids'],
        queryFn: fetchAdminIds,
        enabled: !!firestore,
    });
    
    const { data: allUsers, isLoading: isUsersLoading } = useQuery({
        queryKey: ['all-users-with-admin-status', adminIds],
        queryFn: () => fetchAllUsers(adminIds || []),
        enabled: !!firestore && !!adminIds,
    });
    
    const isLoading = isAdminIdsLoading || isUsersLoading;

    const adminMutation = useMutation({
        mutationFn: async ({ user, makeAdmin }: { user: UserProfile, makeAdmin: boolean }) => {
            if (!firestore) throw new Error("Firestore not available");
            const adminRef = doc(firestore, 'admins', user.id);
            if (makeAdmin) {
                const adminData: Admin = {
                    email: user.email,
                    addedAt: serverTimestamp() as any
                };
                await setDoc(adminRef, adminData);
            } else {
                await deleteDoc(adminRef);
            }
        },
        onSuccess: (_, { makeAdmin, user }) => {
            toast({
                title: 'Success!',
                description: `${user.username} has been ${makeAdmin ? 'promoted to admin' : 'demoted to user'}.`,
            });
            queryClient.invalidateQueries({queryKey: ['admin-ids']});
        },
        onError: (error, { user }) => {
            const permissionError = new FirestorePermissionError({
                path: `admins/${user.id}`,
                operation: 'write',
            });
            errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setUserToToggleAdmin(null);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!firestore || !userToDelete) throw new Error("Firestore or user not available");
            const userDocRef = doc(firestore, 'users', userId);
            const usernameDocRef = doc(firestore, 'usernames', userToDelete.username.toLowerCase());
            
            const batch = writeBatch(firestore);
            batch.delete(userDocRef);
            batch.delete(usernameDocRef);
            await batch.commit();
        },
        onSuccess: () => {
            toast({
                title: "User Deleted",
                description: `The user account has been successfully deleted.`,
            });
            queryClient.invalidateQueries({queryKey: ['all-users-with-admin-status']});
        },
        onError: (error, userId) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${userId}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setUserToDelete(null);
        }
    });

    return (
        <>
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the user account for <span className="font-bold">{userToDelete?.username} ({userToDelete?.email})</span> and remove their username. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={deleteUserMutation.isPending}
                    >
                        {deleteUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete user
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!userToToggleAdmin} onOpenChange={(open) => !open && setUserToToggleAdmin(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to {userToToggleAdmin?.makeAdmin ? 'promote' : 'demote'} <span className="font-bold">{userToToggleAdmin?.user.username}</span>?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => userToToggleAdmin && adminMutation.mutate(userToToggleAdmin)}
                        disabled={adminMutation.isPending}
                    >
                       {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Confirm
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
                                <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Manage Users</h1>
                                <p className="text-muted-foreground mt-2">View and manage all registered users and their roles.</p>
                            </div>
                            {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                        </div>
                        
                        <Card className="mt-8">
                        <CardHeader>
                                <CardTitle>Registered Users</CardTitle>
                                <CardDescription>A list of all users in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TooltipProvider>
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
                                                        {user.isAdmin ? <Badge><ShieldCheck className="mr-1 h-3 w-3" /> Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                                     </TableCell>
                                                    <TableCell>
                                                        {user.registrationDate 
                                                            ? format(new Date(user.registrationDate.seconds * 1000), 'PPP')
                                                            : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        {adminUser?.uid !== user.id && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon"
                                                                            onClick={() => setUserToToggleAdmin({ user, makeAdmin: !user.isAdmin })}
                                                                            disabled={adminMutation.isPending && adminMutation.variables?.user.id === user.id}
                                                                        >
                                                                            {user.isAdmin ? <ShieldOff className="h-4 w-4 text-yellow-500" /> : <ShieldCheck className="h-4 w-4 text-green-500" />}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{user.isAdmin ? 'Demote to User' : 'Promote to Admin'}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon"
                                                                            onClick={() => setUserToDelete(user)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Delete User</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </TooltipProvider>
                        </CardContent>
                        </Card>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}

export default function ManageUsersPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ManageUsersPageContent />
        </Suspense>
    )
}
