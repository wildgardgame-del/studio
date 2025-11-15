
'use client';

import { collection, query, orderBy, doc, updateDoc, getDocs, where, writeBatch, limit } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense, useState } from 'react';
import { Loader2, Mail, MailOpen, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { AdminMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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

function AdminInboxPageContent() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const fetchMessages = async () => {
        if (!firestore) throw new Error("Firestore not available");
        const messagesRef = collection(firestore, 'admin_messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(25));
        
        try {
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminMessage));
        } catch (error) {
            console.error("Error fetching messages:", error);
            const permissionError = new FirestorePermissionError({
                path: 'admin_messages',
                operation: 'list'
            });
            errorEmitter.emit('permission-error', permissionError);
            return [];
        }
    };
    
    const { data: messages, isLoading } = useQuery({
        queryKey: ['admin-messages'],
        queryFn: fetchMessages,
        enabled: !!firestore,
    });
    
    const markAsReadMutation = useMutation({
        mutationFn: async (messageId: string) => {
            if (!firestore) throw new Error("Firestore not available");
            const messageRef = doc(firestore, 'admin_messages', messageId);
            await updateDoc(messageRef, { isRead: true });
        },
        onSuccess: (data, messageId) => {
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
            queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
        },
        onError: (error, messageId) => {
             const permissionError = new FirestorePermissionError({
                path: `admin_messages/${messageId}`,
                operation: 'update',
                requestResourceData: { isRead: true },
              });
              errorEmitter.emit('permission-error', permissionError);
        }
    });
    
    const deleteReadMessagesMutation = useMutation({
        mutationFn: async () => {
            if (!firestore) throw new Error("Firestore not available");
            
            const messagesRef = collection(firestore, 'admin_messages');
            const q = query(messagesRef, where('isRead', '==', true));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                toast({ title: 'No read messages to delete.' });
                return;
            }

            const batch = writeBatch(firestore);
            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        },
        onSuccess: () => {
            toast({
                title: 'Messages Deleted',
                description: 'All read messages have been successfully deleted.',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete read messages. You may not have permission.',
            });
            const permissionError = new FirestorePermissionError({ path: 'admin_messages', operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        },
        onSettled: () => {
            setShowDeleteDialog(false);
        }
    });

    const handleAccordionToggle = (messageId: string, isRead: boolean) => {
        if (!isRead) {
            markAsReadMutation.mutate(messageId);
        }
    }

    return (
        <>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all messages that have been marked as read. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => deleteReadMessagesMutation.mutate()}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        disabled={deleteReadMessagesMutation.isPending}
                    >
                        {deleteReadMessagesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete read messages
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 bg-secondary/30">
                    <div className="container py-12">
                        <div>
                            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Admin Inbox</h1>
                            <p className="text-muted-foreground mt-2">Messages sent by users from the contact form.</p>
                            <Button asChild variant="link" className="p-0 text-accent mt-2">
                                <Link href="/admin">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                        </div>
                        
                        <Card className="mt-8">
                            <CardHeader>
                               <div className="flex items-center justify-between">
                                 <div>
                                    <CardTitle>Received Messages</CardTitle>
                                    <CardDescription>Showing the last 25 messages.</CardDescription>
                                 </div>
                                 <Button variant="outline" onClick={() => setShowDeleteDialog(true)} disabled={(messages?.filter(m => m.isRead).length || 0) === 0}>
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Clear Read Messages
                                 </Button>
                               </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    </div>
                                ) : !messages || messages.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Your inbox is empty.</p>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {messages.map(message => (
                                            <AccordionItem value={message.id} key={message.id}>
                                                <AccordionTrigger
                                                    className={cn(!message.isRead && "font-bold")}
                                                    onClick={() => handleAccordionToggle(message.id, message.isRead)}
                                                >
                                                    <div className="flex items-center gap-4 w-full">
                                                        {message.isRead ? <MailOpen className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary" />}
                                                        <div className="flex-1 text-left">
                                                            <p className="truncate">{message.subject}</p>
                                                            <p className={cn("text-sm text-muted-foreground font-normal", !message.isRead && "text-foreground/80")}>
                                                                From: {message.username} ({message.userEmail})
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground font-normal whitespace-nowrap pr-4">
                                                            {message.createdAt ? format(new Date(message.createdAt.seconds * 1000), 'PPp') : ''}
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="prose dark:prose-invert max-w-none px-4 py-6 whitespace-pre-wrap">
                                                    {message.message}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}

export default function AdminInboxPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AdminInboxPageContent />
        </Suspense>
    )
}
