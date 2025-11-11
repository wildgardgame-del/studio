'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Icons } from "@/components/icons"
import { useUser, useFirebaseApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import heroImage from '@/lib/placeholder-images.json';


export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const firebaseApp = useFirebaseApp(); // Use the hook to get the app instance
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!firebaseApp) return;

    setIsSigningIn(true);
    const auth = getAuth(firebaseApp);

    // This is the crucial part for deployed environments like Vercel.
    // It tells Firebase to trust the domain the popup is originating from.
    if (typeof window !== 'undefined') {
        auth.config.authDomain = window.location.hostname;
    }

    const provider = new GoogleAuthProvider();
    
    try {
      // Set persistence to store the user session
      await setPersistence(auth, browserLocalPersistence);
      // Now, attempt the sign-in
      await signInWithPopup(auth, provider);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');

    } catch (error: any) {
      // Handle common popup errors gracefully
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
            <Card className="mx-auto max-w-sm bg-background/80">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Icons.Logo className="h-12 w-12 text-accent" />
                    </div>
                    <CardTitle className="text-2xl font-headline text-center">Login to GameSphere</CardTitle>
                    <CardDescription className="text-center">
                    Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link href="#" className="ml-auto inline-block text-sm underline">
                            Forgot your password?
                        </Link>
                        </div>
                        <Input id="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSigningIn}>
                        {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login with Google
                    </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/signup" className="underline">
                        Sign up
                    </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  )
}
