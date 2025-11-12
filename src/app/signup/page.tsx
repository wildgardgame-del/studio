
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithPopup } from "firebase/auth";
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


export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningUp, setIsSigningUp] = useState(false);

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleGoogleSignUp = async () => {
        if (!auth) return;
        setIsSigningUp(true);

        const provider = new GoogleAuthProvider();

        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, provider);

            toast({
                title: "Account Created!",
                description: "Just one more step to complete your profile.",
            });
            // The onAuthStateChanged listener in provider will now trigger isNewUser flow
            router.push('/');

        } catch (error: any) {
            console.error("Error signing up with Google: ", error);
            let description = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                description = "The sign-up process was cancelled.";
            }
            toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: description,
            });
        } finally {
            setIsSigningUp(false);
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
                        <CardTitle className="text-2xl font-headline text-center">Create an Account</CardTitle>
                        <CardDescription className="text-center">
                            Continue with Google to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button onClick={handleGoogleSignUp} className="w-full" disabled={isSigningUp}>
                                {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue with Google
                            </Button>
                        </div>
                         <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="underline">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
