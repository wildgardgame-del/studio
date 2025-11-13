
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Suspense, useState, useRef, useEffect } from "react";
import { Send, Loader2, Upload, Link as LinkIcon, Youtube, Trash2, Info, ArrowLeft, Download } from "lucide-react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from 'next/link';

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
import { useFirebase, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/ai/flows/upload-image-flow";
import type { Game } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { availableGenres } from "@/lib/genres";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MATURE_TAG = "Mature 18+";

const formSchema = z.object({
  title: z.string().min(2, "Game title must be at least 2 characters."),
  publisher: z.string().min(2, "Publisher name must be at least 2 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  description: z.string().min(10, "Short description must be at least 10 characters."),
  longDescription: z.string().min(30, "Full description must be at least 30 characters."),
  genres: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one genre.",
  }),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  trailerUrls: z.string().optional(),
  gameFileUrl: z.string().url("Please enter a valid URL for the game file.").optional().or(z.literal('')),
  isAdultContent: z.boolean().default(false),
  coverImage: z.any().optional(),
  screenshots: z.any().optional(),
});

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function EditGamePageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<string[]>([]);

  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const coverImageRef = useRef<HTMLInputElement>(null);
  const screenshotsRef = useRef<HTMLInputElement>(null);

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: gameData, isLoading: isGameLoading } = useDoc<Game>(gameRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", publisher: "", price: 0, description: "", longDescription: "",
      genres: [], websiteUrl: "", trailerUrls: "", gameFileUrl: "", isAdultContent: false,
    },
  });

  useEffect(() => {
    if (gameData) {
      form.reset({
        title: gameData.title,
        publisher: gameData.publisher || "",
        price: gameData.price,
        description: gameData.description,
        longDescription: gameData.longDescription || "",
        genres: gameData.genres?.filter(g => g !== MATURE_TAG) || [], // Exclude mature tag from form state
        websiteUrl: gameData.websiteUrl || "",
        trailerUrls: gameData.trailerUrls?.join(', ') || "",
        gameFileUrl: gameData.gameFileUrl || "",
        isAdultContent: gameData.isAdultContent || false,
      });
      setExistingCoverImage(gameData.coverImage);
      setExistingScreenshots(gameData.screenshots || []);
    }
  }, [gameData, form]);

  const coverImageFile = form.watch("coverImage");
  const screenshotsFiles = form.watch("screenshots");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !gameId || !gameRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update game. Invalid context.' });
      return;
    }

    if (gameData?.developerId !== user.uid) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to edit this game.' });
      if (gameRef) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: gameRef.path, operation: 'update' }));
      }
      return;
    }

    setIsSubmitting(true);
    toast({ title: "Updating game...", description: "Please wait while we upload your files." });

    try {
      let coverImageUrl = existingCoverImage;
      let screenshotUrls = [...existingScreenshots]; 

      // Handle new cover image upload
      if (values.coverImage && values.coverImage.name) {
        const coverImageDataUri = await fileToDataUri(values.coverImage);
        coverImageUrl = await uploadImage({ fileDataUri: coverImageDataUri, fileName: values.coverImage.name });
        toast({ title: "New cover image uploaded!" });
      }

      // Handle new screenshots upload
      if (values.screenshots && values.screenshots.length > 0) {
        const newScreenshotUrls = await Promise.all(
          Array.from(values.screenshots).map(async (file: any) => {
            const dataUri = await fileToDataUri(file);
            return uploadImage({ fileDataUri: dataUri, fileName: file.name });
          })
        );
        screenshotUrls = [...screenshotUrls, ...newScreenshotUrls]; // Append new screenshots
        toast({ title: "New screenshots uploaded!", description: "Finalizing submission..." });
      }

      const trailerUrls = values.trailerUrls?.split(',').map(url => url.trim()).filter(url => url) || [];

      // Handle automatic genre tagging
      let finalGenres = [...values.genres];
      if (values.isAdultContent) {
          if (!finalGenres.includes(MATURE_TAG)) {
              finalGenres.push(MATURE_TAG);
          }
      } else {
          finalGenres = finalGenres.filter(g => g !== MATURE_TAG);
      }

      const updatedGameData = {
        title: values.title,
        publisher: values.publisher,
        price: values.price,
        description: values.description,
        longDescription: values.longDescription,
        genres: finalGenres,
        websiteUrl: values.websiteUrl,
        trailerUrls: trailerUrls,
        gameFileUrl: values.gameFileUrl,
        coverImage: coverImageUrl,
        screenshots: screenshotUrls,
        isAdultContent: values.isAdultContent,
        developerId: user.uid,
        status: 'pending' as const, // Always return to pending status for re-approval
        submittedAt: gameData?.submittedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        rejectionReason: null, // Clear previous rejection reason
      };
      
      await updateDoc(gameRef, updatedGameData);

      toast({
        title: "Changes Submitted!",
        description: `${values.title} has been sent for re-approval.`,
      });

      router.push('/dev/my-games');

    } catch (error: any) {
        console.error("Error updating game:", error);
        
        let errorData = {};
        try {
            errorData = JSON.parse(JSON.stringify(error));
        } catch {}

        if (gameRef && error.code && error.code.includes('permission-denied')) {
            const permissionError = new FirestorePermissionError({
                path: gameRef.path,
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        
        toast({
            variant: 'destructive',
            title: 'Update Error',
            description: error.message || 'Could not complete the operation. Check the console for details.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isGameLoading) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }

  if (!gameData) {
      return (
           <div className="flex min-h-screen flex-col items-center justify-center">
                <p>Game not found or you don't have permission to edit it.</p>
           </div>
      )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="mx-auto max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Edit Game</CardTitle>
            <CardDescription className="text-center">
              Update the details for your game: {gameData?.title}.
            </CardDescription>
             <Button asChild variant="link" className="mx-auto text-accent">
                <Link href="/dev/my-games">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Games
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {gameData.status === 'rejected' && gameData.rejectionReason && (
              <Alert variant="destructive" className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Submission Rejected</AlertTitle>
                <AlertDescription>{gameData.rejectionReason}</AlertDescription>
              </Alert>
            )}
             {gameData.status === 'pending' && gameData.rejectionReason && (
              <Alert className="mb-6 border-yellow-500 text-yellow-500">
                <Info className="h-4 w-4" />
                <AlertTitle>Revision Requested</AlertTitle>
                <AlertDescription>{gameData.rejectionReason}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Game Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="publisher" render={({ field }) => ( <FormItem><FormLabel>Developer / Publisher</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (USD)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="longDescription" render={({ field }) => ( <FormItem><FormLabel>Full Description</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                
                <FormField
                  control={form.control}
                  name="genres"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Genres</FormLabel>
                        <FormDescription>
                          Select all genres that apply to your game. (Choosing irrelevant tags may lead to your submission being rejected)
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableGenres.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="genres"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="websiteUrl" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><LinkIcon /> Official Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="trailerUrls" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Youtube /> YouTube Trailers</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Separate multiple links with commas.</FormDescription><FormMessage /></FormItem> )}/>
                </div>
                
                <FormField control={form.control} name="gameFileUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Download /> Game File URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/my-game.zip" {...field} /></FormControl>
                    <FormDescription>The direct download link for your game's file (e.g., a .zip hosted on Google Drive, Dropbox, etc.).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>


                 <FormField
                    control={form.control}
                    name="isAdultContent"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Adult Content</FormLabel>
                            <FormDescription>
                            Does this game contain explicit nudity or scenes of a sexual nature?
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="coverImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                        <Input type="file" className="hidden" ref={coverImageRef} accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                     {coverImageFile && coverImageFile.name ? (
                        <div className="relative w-48 mx-auto">
                            <Image src={URL.createObjectURL(coverImageFile)} alt="New cover preview" width={300} height={400} className="rounded-md object-cover aspect-[3/4]" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={() => form.setValue("coverImage", null)}> <Trash2 className="h-4 w-4"/> </Button>
                        </div>
                    ) : existingCoverImage ? (
                        <div className="relative w-48 mx-auto">
                            <Image src={existingCoverImage} alt="Current cover" width={300} height={400} className="rounded-md object-cover aspect-[3/4]" />
                            <Button type="button" variant="secondary" size="sm" className="absolute bottom-2 left-1/2 -translate-x-1/2" onClick={() => coverImageRef.current?.click()}>Replace</Button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => coverImageRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Upload className="h-8 w-8"/><span>Upload a cover image</span><span className="text-xs">(Max 5MB)</span>
                        </button>
                    )}
                    <FormDescription>
                      Recommended resolution: 600x800px (3:4 aspect ratio).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={form.control} name="screenshots" render={({ field }) => (
                   <FormItem>
                    <FormLabel>Screenshots</FormLabel>
                     <FormControl>
                        <Input type="file" className="hidden" ref={screenshotsRef} accept={ACCEPTED_IMAGE_TYPES.join(",")} multiple onChange={(e) => field.onChange(e.target.files)} />
                    </FormControl>
                    <button type="button" onClick={() => screenshotsRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Upload className="h-8 w-8"/>
                        <span>{screenshotsFiles?.length > 0 || existingScreenshots.length > 0 ? 'Add or replace screenshots' : 'Upload screenshots'}</span>
                        <span className="text-xs">(Up to 5 images, 5MB each)</span>
                    </button>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {(screenshotsFiles && screenshotsFiles.length > 0 ? Array.from(screenshotsFiles) : existingScreenshots).map((item: any, index) => (
                             <div key={index} className="relative">
                                <Image src={item instanceof File ? URL.createObjectURL(item) : item} alt={`Screenshot preview ${index + 1}`} width={160} height={90} className="rounded-md object-cover aspect-video" />
                             </div>
                        ))}
                    </div>
                    <FormMessage />
                   </FormItem>
                )}/>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating... </> ) : ( <><Send className="mr-2 h-4 w-4" /> Save and Submit for Review </> )}
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

export default function EditGamePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <EditGamePageContent />
        </Suspense>
    )
}
