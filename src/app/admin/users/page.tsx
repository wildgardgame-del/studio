
'use client';

import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useState } from 'react';
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
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

type UserProfile = {
    id: string;
    username: string;
    email: string;
    registrationDate: {
        seconds: number;
        nanoseconds: number;
    } | null;
    isAdmin?: boolean;
}

function ManageUsersPageContent() {
    const { firestore, user: adminUser } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [userToModify, setUserToModify] = useState<{user: UserProfile, makeAdmin: boolean} | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    const fetchAllUsers = async () => {
        if (!firestore) throw new Error("Firestore not available");
        
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, orderBy('registrationDate', 'desc'));
            const usersSnapshot = await getDocs(q);
            return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));

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
    
    const adminMutation = useMutation({
        mutationFn: async ({ user, makeAdmin }: { user: UserProfile, makeAdmin: boolean }) => {
            if (!firestore) throw new Error("Firestore not available");
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, { isAdmin: makeAdmin });
        },
        onSuccess: (_, { user, makeAdmin }) => {
            toast({
                title: "Role Updated",
                description: `${user.username} has been ${makeAdmin ? 'promoted to Admin' : 'demoted to User'}.`,
            });
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
        },
        onError: (error, { user, makeAdmin }) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.id}`,
                operation: 'update',
                requestResourceData: { isAdmin: makeAdmin }
            });
            errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setUserToModify(null);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!firestore) throw new Error("Firestore not available");
            const userDocRef = doc(firestore, 'users', userId);
            
            // Note: Deleting a user from Firebase Auth is a privileged operation
            // that should be handled by a Cloud Function for security reasons.
            // This mutation only deletes the Firestore user document.
            await deleteDoc(userDocRef);
        },
        onSuccess: (_, userId) => {
            toast({
                title: "User Deleted",
                description: `The user's Firestore record has been deleted.`,
            });
            queryClient.invalidateQueries({queryKey: ['all-users']});
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
             <AlertDialog open={!!userToModify} onOpenChange={(open) => !open && setUserToModify(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to {userToModify?.makeAdmin ? 'promote' : 'demote'} <span className="font-bold">{userToModify?.user.username}</span> {userToModify?.makeAdmin ? 'to' : 'from'} an Admin role?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => userToModify && adminMutation.mutate(userToModify)}
                        disabled={adminMutation.isPending}
                    >
                        {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the user account for <span className="font-bold">{userToDelete?.username} ({userToDelete?.email})</span> from the database. This action cannot be undone. This does not delete their authentication record.
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
                        Yes, delete user document
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
                                                        {adminUser?.email !== user.email && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                         <Button 
                                                                            variant="ghost" 
                                                                            size="icon"
                                                                            onClick={() => setUserToModify({ user, makeAdmin: !user.isAdmin })}
                                                                            disabled={adminMutation.isPending && userToModify?.user.id === user.id}
                                                                        >
                                                                            {user.isAdmin 
                                                                                ? <ShieldOff className="h-4 w-4 text-yellow-500" />
                                                                                : <ShieldCheck className="h-4 w-4 text-green-500" />}
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
                                                                            disabled={deleteUserMutation.isPending && userToDelete?.id === user.id}
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
