
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Suspense, useState, useRef, useEffect } from "react";
import { Send, Loader2, Upload, Link as LinkIcon, Youtube, Trash2, Info, ArrowLeft, Download, Github, HelpCircle, ShieldAlert, Heart, Image as ImageIcon } from "lucide-react";
import { doc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
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
import { useFirebase, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError, useQuery } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/ai/flows/upload-image-flow";
import type { Game } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { availableGenres } from "@/lib/genres";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useGameStore } from "@/context/game-store-context";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MATURE_TAG = "Mature 18+";

const formSchema = z.object({
  title: z.string().min(2, "Game title must be at least 2 characters."),
  publisher: z.string().min(2, "Publisher name must be at least 2 characters."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  isPayWhatYouWant: z.boolean().default(false),
  isInDevelopment: z.boolean().default(false),
  description: z.string().min(10, "Short description must be at least 10 characters."),
  longDescription: z.string().min(30, "Full description must be at least 30 characters."),
  genres: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one genre.",
  }),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  trailerUrls: z.string().optional(),
  gameFileUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  githubRepoUrl: z.string().url("Must be a valid GitHub repository URL.").optional().or(z.literal('')),
  isAdultContent: z.boolean().default(false),
  coverImage: z.any().optional(),
  bannerImage: z.any().optional(),
  screenshots: z.any().optional(),
}).refine(data => {
    if (data.isInDevelopment) return true; // If in development, download links are not required
    return !!data.gameFileUrl || !!data.githubRepoUrl;
}, {
    message: "You must provide either a direct download URL or a GitHub repository URL if the game is not 'In Development'.",
    path: ["gameFileUrl"],
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
  const [existingBannerImage, setExistingBannerImage] = useState<string | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<string[]>([]);

  const { user, isUserLoading, firestore } = useFirebase();
  const { isPurchased, purchasedGames } = useGameStore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const coverImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);
  const screenshotsRef = useRef<HTMLInputElement>(null);
  
  const hasDevLicense = isPurchased('dev-account-upgrade') || isPurchased('dev-android-account-upgrade');

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists();
    },
    enabled: !!user && !!firestore,
  });
  
  useEffect(() => {
    const isPageLoading = isUserLoading || purchasedGames === undefined || isAdminLoading;
    // Don't redirect admins, even if they don't have a dev license
    if (!isPageLoading && !isAdmin && (!user || !hasDevLicense)) {
      router.push('/apply-for-dev');
    }
  }, [isUserLoading, purchasedGames, user, hasDevLicense, router, isAdmin, isAdminLoading]);


  const gameRef = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: gameData, isLoading: isGameLoading } = useDoc<Game>(gameRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", publisher: "", price: 0, isPayWhatYouWant: false, isInDevelopment: false, description: "", longDescription: "",
      genres: [], websiteUrl: "", trailerUrls: "", gameFileUrl: "", githubRepoUrl: "", isAdultContent: false
    },
  });

  useEffect(() => {
    if (gameData) {
      form.reset({
        title: gameData.title,
        publisher: gameData.publisher || "",
        price: gameData.price,
        isPayWhatYouWant: gameData.isPayWhatYouWant || false,
        isInDevelopment: gameData.isInDevelopment || false,
        description: gameData.description,
        longDescription: gameData.longDescription || "",
        genres: gameData.genres?.filter(g => g !== MATURE_TAG) || [],
        websiteUrl: gameData.websiteUrl || "",
        trailerUrls: gameData.trailerUrls?.join(', ') || "",
        gameFileUrl: gameData.gameFileUrl || "",
        githubRepoUrl: gameData.githubRepoUrl || "",
        isAdultContent: gameData.isAdultContent || false,
      });
      setExistingCoverImage(gameData.coverImage);
      setExistingBannerImage(gameData.bannerImage || null);
      setExistingScreenshots(gameData.screenshots || []);
    }
  }, [gameData, form]);

  const coverImageFile = form.watch("coverImage");
  const bannerImageFile = form.watch("bannerImage");
  const screenshotsFiles = form.watch("screenshots");
  const isPayWhatYouWant = form.watch("isPayWhatYouWant");

  useEffect(() => {
    if (isPayWhatYouWant) {
        form.setValue("price", 0);
    }
  }, [isPayWhatYouWant, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !gameId || !gameRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update game. Invalid context.' });
      return;
    }
    
    // Admins can edit any game, others must be the developer.
    if (!isAdmin && gameData?.developerId !== user.uid) {
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
      let bannerImageUrl = existingBannerImage;
      let screenshotUrls = [...existingScreenshots]; 

      if (values.coverImage && values.coverImage.name) {
        const coverImageDataUri = await fileToDataUri(values.coverImage);
        coverImageUrl = await uploadImage({ fileDataUri: coverImageDataUri, fileName: values.coverImage.name });
        toast({ title: "New cover image uploaded!" });
      }

      if (values.bannerImage && values.bannerImage.name) {
        const bannerImageDataUri = await fileToDataUri(values.bannerImage);
        bannerImageUrl = await uploadImage({ fileDataUri: bannerImageDataUri, fileName: values.bannerImage.name });
        toast({ title: "New banner image uploaded!" });
      }

      if (values.screenshots && values.screenshots.length > 0) {
        const newScreenshotUrls = await Promise.all(
          Array.from(values.screenshots).map(async (file: any) => {
            const dataUri = await fileToDataUri(file);
            return uploadImage({ fileDataUri: dataUri, fileName: file.name });
          })
        );
        screenshotUrls = [...screenshotUrls, ...newScreenshotUrls];
        toast({ title: "New screenshots uploaded!", description: "Finalizing submission..." });
      }

      const trailerUrls = values.trailerUrls?.split(',').map(url => url.trim()).filter(url => url) || [];

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
        isPayWhatYouWant: values.isPayWhatYouWant,
        isInDevelopment: values.isInDevelopment,
        description: values.description,
        longDescription: values.longDescription,
        genres: finalGenres,
        websiteUrl: values.websiteUrl,
        trailerUrls: trailerUrls,
        gameFileUrl: values.gameFileUrl,
        githubRepoUrl: values.githubRepoUrl,
        coverImage: coverImageUrl,
        bannerImage: bannerImageUrl,
        screenshots: screenshotUrls,
        isAdultContent: values.isAdultContent,
        developerId: gameData?.developerId || user.uid, // Preserve original developer
        status: 'pending' as const,
        submittedAt: gameData?.submittedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        rejectionReason: null,
      };
      
      await updateDoc(gameRef, updatedGameData);

      toast({
        title: "Changes Submitted!",
        description: `${values.title} has been sent for re-approval.`,
      });
      
      const destination = isAdmin ? '/admin/games' : '/dev/my-games';
      router.push(destination);

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
  
  const isLoading = isGameLoading || isUserLoading || purchasedGames === undefined || isAdminLoading;
  const isOwner = gameData?.developerId === user?.uid;
  const canAccess = isOwner || isAdmin;

  if (isLoading) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
      )
  }

  if (!gameData || !user || !canAccess) {
      return (
           <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
               <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2 max-w-md">
                    { !user ? "You must be logged in to edit a game." :
                      !gameData ? "Game not found." :
                      "You do not have permission to edit this game."
                    }
                </p>
                <Button asChild className="mt-6">
                    <Link href={!user ? "/login" : "/browse"}>
                        { !user ? "Login" : "Back to Store" }
                    </Link>
                </Button>
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
                <Link href={isAdmin ? "/admin/games" : "/dev/my-games"}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {isAdmin ? "Manage Games" : "My Games"}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <FormField control={form.control} name="price" render={({ field }) => ( 
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} disabled={isPayWhatYouWant} /></FormControl>
                        <FormDescription>Set to 0 for a free game.</FormDescription>
                        <FormMessage />
                      </FormItem> 
                    )}/>
                     <FormField
                        control={form.control}
                        name="isPayWhatYouWant"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full mt-1">
                                <div className="space-y-0.5">
                                    <FormLabel>Pay What You Want</FormLabel>
                                    <FormDescription className="text-xs">
                                        Allow players to download for free or pay an amount of their choice.
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
                </div>

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
                
                 <FormField
                    control={form.control}
                    name="isInDevelopment"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-secondary/50">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">In Development</FormLabel>
                            <FormDescription>
                                Mark this if the game is not yet released. Download links will not be required.
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

                <div>
                    <FormLabel>Game Download</FormLabel>
                    <FormDescription className="mb-4">Provide a link for users to download the game. You can use either a direct link or a GitHub repository.</FormDescription>
                    <FormField control={form.control} name="gameFileUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-normal"><Download /> Direct Download URL</FormLabel>
                        <FormControl><Input placeholder="https://example.com/my-game.zip" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                    <div className="relative my-4 flex items-center">
                        <Separator className="flex-1" />
                        <span className="mx-2 text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>
                     <FormField control={form.control} name="githubRepoUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-normal">
                                <Github /> GitHub Repository
                                <Button asChild variant="link" size="icon" className="h-4 w-4 text-accent">
                                    <Link href="/dev/docs/github-releases" target="_blank">
                                        <HelpCircle />
                                    </Link>
                                </Button>
                            </FormLabel>
                            <FormControl><Input placeholder="https://github.com/user/repo" {...field} /></FormControl>
                            <FormDescription>We will automatically use the download link from your latest public release.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>


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
                
                <Separator />
                
                <div className="space-y-6">
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

                    <FormField control={form.control} name="bannerImage" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Banner Image (Optional)</FormLabel>
                        <FormControl>
                            <Input type="file" className="hidden" ref={bannerImageRef} accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => field.onChange(e.target.files?.[0])} />
                        </FormControl>
                        {bannerImageFile && bannerImageFile.name ? (
                             <div className="relative w-full mx-auto">
                                <Image src={URL.createObjectURL(bannerImageFile)} alt="New banner preview" width={1920} height={1080} className="rounded-md object-cover aspect-video" />
                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={() => form.setValue("bannerImage", null)}> <Trash2 className="h-4 w-4"/> </Button>
                            </div>
                        ) : existingBannerImage ? (
                            <div className="relative w-full mx-auto">
                                <Image src={existingBannerImage} alt="Current banner" width={1920} height={1080} className="rounded-md object-cover aspect-video" />
                                <Button type="button" variant="secondary" size="sm" className="absolute bottom-2 left-1/2 -translate-x-1/2" onClick={() => bannerImageRef.current?.click()}>Replace</Button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => bannerImageRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                                <ImageIcon className="h-8 w-8"/><span>Upload a banner image</span><span className="text-xs">Recommended: 1920x1080px (16:9 aspect ratio)</span>
                            </button>
                        )}
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
                </div>


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
