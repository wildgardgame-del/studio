'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Suspense, useState, useRef, useEffect } from "react";
import { Send, Loader2, Upload, Link as LinkIcon, Youtube, ArrowLeft, Download, Github, HelpCircle, ShieldAlert } from "lucide-react";
import { collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
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
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { uploadImage } from "@/ai/flows/upload-image-flow";
import { Checkbox } from "@/components/ui/checkbox";
import { availableGenres } from "@/lib/genres";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useGameStore } from "@/context/game-store-context";

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
  gameFileUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  githubRepoUrl: z.string().url("Must be a valid GitHub repository URL.").optional().or(z.literal('')),
  isAdultContent: z.boolean().default(false),
  coverImage: z.any()
    .refine((file) => !!file, "Cover image is required.")
    .refine((file) => file?.size <= 5_000_000, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  screenshots: z.any()
    .refine((files) => files?.length > 0, "At least one screenshot is required.")
    .refine((files) => files?.length <= 5, "You can upload a maximum of 5 screenshots.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= 5_000_000), `Max file size per screenshot is 5MB.`)
    .refine(
      (files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      "Only .jpg, .jpeg, .png and .webp files are accepted."
    ),
}).refine(data => !!data.gameFileUrl || !!data.githubRepoUrl, {
    message: "You must provide either a direct download URL or a GitHub repository URL.",
    path: ["gameFileUrl"], // Assign error to one of the fields
});


const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function SubmitGamePageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isUserLoading, firestore } = useFirebase();
  const { isPurchased, purchasedGames } = useGameStore();
  const { toast } = useToast();
  const router = useRouter();

  const coverImageRef = useRef<HTMLInputElement>(null);
  const screenshotsRef = useRef<HTMLInputElement>(null);

  const isLoading = isUserLoading || purchasedGames === undefined;
  const hasDevLicense = isPurchased('dev-account-upgrade') || isPurchased('dev-android-account-upgrade');
  
  useEffect(() => {
    if (!isLoading && (!user || !hasDevLicense)) {
      router.push('/apply-for-dev');
    }
  }, [isLoading, user, hasDevLicense, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      publisher: "",
      price: 0,
      description: "",
      longDescription: "",
      genres: [],
      websiteUrl: "",
      trailerUrls: "",
      gameFileUrl: "",
      githubRepoUrl: "",
      isAdultContent: false,
    },
  });

  const coverImage = form.watch("coverImage");
  const screenshots = form.watch("screenshots");

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
    toast({ title: "Starting submission...", description: "Please wait while we upload your files." });

    try {
      // 1. Upload Cover Image
      const coverImageDataUri = await fileToDataUri(values.coverImage);
      const coverImageUrl = await uploadImage({ fileDataUri: coverImageDataUri, fileName: values.coverImage.name });
      toast({ title: "Cover image uploaded!", description: "Now uploading screenshots..." });
      
      // 2. Upload Screenshots
      const screenshotUrls = await Promise.all(
        Array.from(values.screenshots).map(async (file: any) => {
            const dataUri = await fileToDataUri(file);
            return uploadImage({ fileDataUri: dataUri, fileName: file.name });
        })
      );
      toast({ title: "Screenshots uploaded!", description: "Finalizing submission..." });
      
      const trailerUrls = values.trailerUrls?.split(',').map(url => url.trim()).filter(url => url) || [];

      // Handle automatic genre tagging
      let finalGenres = [...values.genres];
      if (values.isAdultContent) {
        if (!finalGenres.includes(MATURE_TAG)) {
            finalGenres.push(MATURE_TAG);
        }
      }

      // 3. Prepare game data for Firestore
      const newGameData = {
        title: values.title,
        publisher: values.publisher,
        price: values.price,
        description: values.description,
        longDescription: values.longDescription,
        genres: finalGenres,
        websiteUrl: values.websiteUrl,
        trailerUrls: trailerUrls,
        gameFileUrl: values.gameFileUrl,
        githubRepoUrl: values.githubRepoUrl,
        coverImage: coverImageUrl,
        screenshots: screenshotUrls,
        isAdultContent: values.isAdultContent,
        developerId: user.uid,
        status: 'pending' as const,
        submittedAt: serverTimestamp(),
        rating: 0,
        reviews: [],
      };

      // 4. Save to Firestore (non-blocking)
      addDocumentNonBlocking(collection(firestore, `games`), newGameData);

      toast({
        title: "Game Submitted!",
        description: "Thank you! Your game will be reviewed shortly.",
      });
      
      await new Promise(res => setTimeout(res, 500));
      router.push('/dev/dashboard');

    } catch (error: any) {
      console.error("Error submitting game:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error.message || 'Could not complete the operation. Check the console for details.',
      });
       setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasDevLicense) {
       return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
            <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2 max-w-md">You need a publisher license to access this page. You are being redirected.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="mx-auto max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Submit a New Game</CardTitle>
            <CardDescription className="text-center">
              Fill in the details below to add your game to Forge Gate Hub.
            </CardDescription>
             <Button asChild variant="link" className="mx-auto text-accent">
                <Link href="/dev/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Title</FormLabel>
                      <FormControl><Input placeholder="My Awesome Game" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>

                  <FormField control={form.control} name="publisher" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Developer / Publisher</FormLabel>
                      <FormControl><Input placeholder="Your Studio Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                
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
                    <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><LinkIcon /> Official Website</FormLabel>
                        <FormControl><Input placeholder="https://my-awesome-game.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}/>
                    
                    <FormField control={form.control} name="trailerUrls" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Youtube /> YouTube Trailers</FormLabel>
                        <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormDescription>Separate multiple links with commas.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}/>
                </div>
                
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


                <FormField control={form.control} name="coverImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            className="hidden"
                            ref={coverImageRef}
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                    </FormControl>
                    {!coverImage ? (
                        <button type="button" onClick={() => coverImageRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Upload className="h-8 w-8"/>
                            <span>Click to upload a cover image</span>
                            <span className="text-xs">(Max 5MB)</span>
                        </button>
                    ) : (
                        <div className="relative w-48 mx-auto">
                            <Image src={URL.createObjectURL(coverImage)} alt="Cover preview" width={300} height={400} className="rounded-md object-cover aspect-[3/4]" />
                             <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={() => form.setValue("coverImage", null)}>
                                <span className="sr-only">Remove image</span>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            </Button>
                        </div>
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
                        <Input
                            type="file"
                            className="hidden"
                            ref={screenshotsRef}
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            multiple
                            onChange={(e) => field.onChange(e.target.files)}
                        />
                    </FormControl>
                    <button type="button" onClick={() => screenshotsRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <Upload className="h-8 w-8"/>
                        <span>Click to upload screenshots</span>
                        <span className="text-xs">(Up to 5 images, 5MB each)</span>
                    </button>
                     {screenshots && screenshots.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {Array.from(screenshots).map((file: any, index) => (
                                <div key={index} className="relative">
                                    <Image src={URL.createObjectURL(file)} alt={`Screenshot preview ${index + 1}`} width={160} height={90} className="rounded-md object-cover aspect-video" />
                                </div>
                            ))}
                        </div>
                    )}
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

export default function SubmitGamePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SubmitGamePageContent />
        </Suspense>
    )
}
