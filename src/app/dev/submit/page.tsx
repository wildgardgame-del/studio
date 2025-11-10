'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  title: z.string().min(2, "Game title must be at least 2 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  description: z.string().min(10, "Short description must be at least 10 characters."),
  longDescription: z.string().min(30, "Full description must be at least 30 characters."),
  genres: z.string().min(3, "Please enter at least one genre."),
  coverImage: z.string().url("Please enter a valid URL for the cover image."),
  screenshots: z.string().min(10, "Please enter at least one screenshot URL."),
});

export default function SubmitGamePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      price: 0,
      description: "",
      longDescription: "",
      genres: "",
      coverImage: "",
      screenshots: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to submit a game.',
      });
      return router.push('/login');
    }

    setIsSubmitting(true);

    try {
      const newGameData = {
        title: values.title,
        price: values.price,
        description: values.description,
        longDescription: values.longDescription,
        genres: values.genres.split(',').map(g => g.trim()),
        coverImage: values.coverImage,
        screenshots: values.screenshots.split(',').map(url => url.trim()),
        developerId: user.uid,
        status: 'pending' as const,
        submittedAt: serverTimestamp(),
        rating: 0,
        reviews: [],
      };

      // Use the non-blocking version to create the document
      addDocumentNonBlocking(collection(firestore, `games`), newGameData);

      toast({
        title: "Game Submitted!",
        description: "Thank you for submitting your game. It will be reviewed shortly.",
      });
      
      // Wait a moment for the toast to appear before redirecting
      await new Promise(res => setTimeout(res, 500));
      router.push('/dev/dashboard');

    } catch (error: any) {
      console.error("Error submitting game:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error.message || 'Could not complete the operation.',
      });
    } finally {
        // Submission is so fast now we don't need to manage the `isSubmitting` state
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="mx-auto max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Submit a New Game</CardTitle>
            <CardDescription className="text-center">
              Fill in the details below to add your game to GameSphere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Title</FormLabel>
                    <FormControl><Input placeholder="My Awesome Game" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl><Textarea placeholder="A brief synopsis for the game card." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="longDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl><Textarea rows={5} placeholder="Describe your game in detail for the store page." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="genres" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genres</FormLabel>
                    <FormControl><Input placeholder="Action, RPG, Strategy" {...field} /></FormControl>
                    <FormDescription>Separate multiple genres with commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="coverImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl><Input type="text" placeholder="https://example.com/cover.jpg" {...field} /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="screenshots" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Screenshot URLs</FormLabel>
                    <FormControl><Textarea placeholder="https://example.com/ss1.jpg, https://example.com/ss2.jpg" {...field} /></FormControl>
                    <FormDescription>Paste URLs separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Game for Review
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
