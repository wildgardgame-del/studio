
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Loader2, Wallet } from "lucide-react";
import Image from "next/image";
import { ethers } from 'ethers';

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
import { useUser, useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { user, isUserLoading, signInWithWallet } = useFirebase(); // Use signInWithWallet from the hook
  const auth = useFirebase().auth;
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isWalletSigningIn, setIsWalletSigningIn] = useState(false);

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

  const handleWalletSignIn = async () => {
    setIsWalletSigningIn(true);
    try {
      await signInWithWallet();
      toast({
        title: "Login Successful",
        description: "Welcome!",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Wallet Login Failed",
        description: error.message || "Could not sign in with wallet. Please try again.",
      });
    } finally {
      setIsWalletSigningIn(false);
    }
  }


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
            src="/images/GamerF.jpg"
            alt="Gaming background"
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
                    <CardTitle className="text-2xl font-headline text-center">Access Forge Gate Hub</CardTitle>
                    <CardDescription className="text-center">
                        Sign in or create an account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleSigningIn || isWalletSigningIn}>
                            {isGoogleSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue with Google
                        </Button>
                        <div className="relative my-2">
                          <Separator />
                          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">OR</span>
                        </div>
                        <Button variant="secondary" className="w-full" onClick={handleWalletSignIn} disabled={isWalletSigningIn || isGoogleSigningIn}>
                            {isWalletSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                            Continue with Wallet
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  )
}
