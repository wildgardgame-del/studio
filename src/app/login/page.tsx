'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, User } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
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
import { useUser, useAuth, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import heroImage from '@/lib/placeholder-images.json';


export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const createUserProfile = async (firebaseUser: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, "users", firebaseUser.uid);

    try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            const userData = {
                id: firebaseUser.uid,
                username: firebaseUser.displayName || 'Anonymous User',
                email: firebaseUser.email,
                registrationDate: serverTimestamp(),
            };
            // Use setDoc with merge:true to create or update without overwriting
            await setDoc(userRef, userData, { merge: true });
        }
    } catch (error: any) {
        console.error("Error creating user profile:", error);
        // We can optionally emit a permission error if that's the expected failure mode
        if (error.code && error.code.includes('permission-denied')) {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create'
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;

    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      
      // After successful sign-in, create the user profile document
      await createUserProfile(result.user);
      
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
                        <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={56} height={56} />
                    </div>
                    <CardTitle className="text-2xl font-headline text-center">Login to GameSphere</CardTitle>
                    <CardDescription className="text-center">
                        Use your Google account to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSigningIn}>
                          {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Login with Google
                      </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  )
}
