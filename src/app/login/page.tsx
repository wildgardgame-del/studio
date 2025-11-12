
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import heroImage from '@/lib/placeholder-images.json';
import Link from "next/link";


const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
})

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;

    setIsGoogleSigningIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');

    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Google Sign-In cancelled by user.");
      } else {
        console.error("Error signing in with Google: ", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred. Please ensure popups are enabled and try again.",
        });
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleEmailSignIn = async (values: z.infer<typeof loginFormSchema>) => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Error signing in with email: ", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
    } finally {
      setIsSigningIn(false);
    }
  };


  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
        <Image
            src={heroImage.placeholderImages[0].imageUrl}
            alt="Futuristic city background"
            data-ai-hint="cyberpunk city"
            fill
            className="object-cover -z-10"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Tabs defaultValue="email" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="google">Google</TabsTrigger>
                </TabsList>
                <TabsContent value="email">
                    <Card className="bg-background/80">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={56} height={56} />
                            </div>
                            <CardTitle className="text-2xl font-headline text-center">Welcome Back</CardTitle>
                            <CardDescription className="text-center">
                                Enter your email and password to sign in.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                     <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <Button type="submit" className="w-full" disabled={isSigningIn}>
                                        {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign In
                                    </Button>
                                </form>
                            </Form>
                            <div className="mt-4 text-center text-sm">
                                Don't have an account?{" "}
                                <Link href="/signup" className="underline">
                                    Sign up
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="google">
                    <Card className="bg-background/80">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={56} height={56} />
                            </div>
                            <CardTitle className="text-2xl font-headline text-center">Login to GameSphere</CardTitle>
                            <CardDescription className="text-center">
                                Use your Google account to continue.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleSigningIn}>
                                {isGoogleSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Login with Google
                            </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
        <Footer />
    </div>
  )
}
