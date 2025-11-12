
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useFirebase } from "@/firebase";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, writeBatch, serverTimestamp, doc } from "firebase/firestore";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Suspense, useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "firebase/auth";

type UserProfile = {
    id: string;
    username: string;
    email: string;
}

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  type: z.enum(["system", "promotion"]),
  link: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  selectedUsers: z.array(z.string()).refine(value => value.length > 0, {
      message: "You must select at least one user."
  })
});

function SendNotificationsContent() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [selectAll, setSelectAll] = useState(false);

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['all-users-for-notifications'],
        queryFn: async () => {
            if (!firestore) return [];
            const usersRef = collection(firestore, 'users');
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => doc.data() as UserProfile);
        },
        enabled: !!firestore,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            message: "",
            type: "system",
            link: "",
            selectedUsers: [],
        },
    });

    useEffect(() => {
        if (selectAll && users) {
            form.setValue('selectedUsers', users.map(u => u.id));
        } else if (!selectAll) {
            // This is tricky; we don't want to clear if the user is unchecking "select all" to manually deselect a few.
            // A better user experience might be to just let them uncheck individuals.
            // So we'll only clear if they uncheck and the list was fully selected.
            const allUserIds = users?.map(u => u.id) || [];
            if (form.getValues('selectedUsers').length === allUserIds.length) {
                 form.setValue('selectedUsers', []);
            }
        }
    }, [selectAll, users, form]);
    

    const sendNotificationMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            if (!firestore) throw new Error("Firestore not available");
            const batch = writeBatch(firestore);
            const { title, message, type, link, selectedUsers } = values;

            selectedUsers.forEach(userId => {
                const newNotifRef = doc(collection(firestore, `users/${userId}/notifications`));
                const notificationData = {
                    userId: userId,
                    title: title,
                    message: message,
                    isRead: false,
                    createdAt: serverTimestamp(),
                    type: type,
                    ...(link && { link: link }),
                };
                batch.set(newNotifRef, notificationData);
            });

            await batch.commit();
        },
        onSuccess: (_, variables) => {
            toast({
                title: "Notifications Sent!",
                description: `A notification has been sent to ${variables.selectedUsers.length} user(s).`,
            });
            form.reset();
            setSelectAll(false);
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: "Error Sending Notifications",
                description: error.message || "An unknown error occurred.",
            });
        }
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        sendNotificationMutation.mutate(values);
    }
    
    return (
      <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-secondary/30">
              <div className="container py-12">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Send Notification</h1>
                  <p className="text-muted-foreground mt-2">Craft and send notifications to your users.</p>

                  <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Notification Composer</CardTitle>
                        <CardDescription>Fill out the details below. The notification will be sent immediately.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl><Input {...field} placeholder="E.g., System Maintenance Alert" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="message" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl><Textarea {...field} rows={5} placeholder="E.g., We will be undergoing scheduled maintenance..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a notification type" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="system">System</SelectItem>
                                                    <SelectItem value="promotion">Promotion</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                     )} />
                                    <FormField control={form.control} name="link" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Optional Link</FormLabel>
                                            <FormControl><Input {...field} placeholder="https://your-link.com/more-info" /></FormControl>
                                            <FormDescription>An optional URL to navigate to when the notification is clicked.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="selectedUsers"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Recipients</FormLabel>
                                                 {isLoadingUsers ? (
                                                    <div className="flex items-center justify-center h-60 border rounded-md"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                                 ) : (
                                                    <>
                                                    <div className="flex items-center space-x-2 pb-2">
                                                        <Checkbox id="select-all" checked={selectAll} onCheckedChange={(checked) => setSelectAll(!!checked)} />
                                                        <label htmlFor="select-all" className="text-sm font-medium">Select All Users ({users?.length || 0})</label>
                                                    </div>
                                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                                         {users?.map(user => (
                                                            <FormField
                                                                key={user.id}
                                                                control={form.control}
                                                                name="selectedUsers"
                                                                render={({ field }) => {
                                                                return (
                                                                    <FormItem key={user.id} className="flex flex-row items-center space-x-3 space-y-0 mb-2">
                                                                        <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(user.id)}
                                                                            onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, user.id])
                                                                                : field.onChange(field.value?.filter(value => value !== user.id))
                                                                            }}
                                                                        />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal flex flex-col">
                                                                            <span>{user.username}</span>
                                                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                )
                                                                }}
                                                            />
                                                         ))}
                                                    </ScrollArea>
                                                    </>
                                                 )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={sendNotificationMutation.isPending}>
                                        {sendNotificationMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sending...</> : <><Send className="mr-2 h-4 w-4"/> Send Notification</>}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                  </Card>
              </div>
          </main>
          <Footer />
      </div>
    )
}

export default function SendNotificationsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SendNotificationsContent />
        </Suspense>
    )
}
