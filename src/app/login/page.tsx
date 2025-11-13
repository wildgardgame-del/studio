
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";
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
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import heroImage from '@/lib/placeholder-images.json';
import Link from "next/link";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

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
            <Card className="w-[400px] bg-background/80">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={56} height={56} />
                    </div>
                    <CardTitle className="text-2xl font-headline text-center">Access GameSphere</CardTitle>
                    <CardDescription className="text-center">
                        Use your Google account to sign in or create an account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleSigningIn}>
                            {isGoogleSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue with Google
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  )
}
