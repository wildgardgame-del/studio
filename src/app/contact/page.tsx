
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";


const formSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(20, "Message must be at least 20 characters."),
});

function ContactAdminPageContent() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: "",
            message: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Not signed in', description: 'You must be logged in to send a message.' });
            return;
        }
        setIsSubmitting(true);

        const messageData = {
            userId: user.uid,
            username: user.displayName || 'N/A',
            userEmail: user.email || 'N/A',
            subject: values.subject,
            message: values.message,
            createdAt: serverTimestamp(),
            isRead: false,
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'admin_messages'), messageData);
            toast({
                title: 'Message Sent!',
                description: 'Thank you for your feedback. The admin team will review it shortly.',
            });
            router.push('/');
        } catch (error: any) {
            console.error('Error sending message:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not send your message. Please try again later.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30 py-16">
                <div className="container flex justify-center">
                    <Card className="w-full max-w-2xl">
                        <CardHeader className="text-center">
                            <CardTitle className="font-headline text-3xl">Contact Administrator</CardTitle>
                            <CardDescription>Have a question or feedback? Let us know.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="subject" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl><Input {...field} placeholder="e.g., Feedback about a game" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="message" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl><Textarea rows={8} {...field} placeholder="Please provide as much detail as possible..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sending...</> : <><Send className="mr-2 h-4 w-4"/>Send Message</>}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function ContactAdminPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ContactAdminPageContent />
        </Suspense>
    )
}
