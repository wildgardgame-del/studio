'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      
      if (error.code === 'auth/operation-not-allowed') {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Google Sign-In is not enabled for this project. Please enable it in the Firebase console.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred during Google sign-in.",
        });
      }
    }
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Card className="mx-auto max-w-sm">
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
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                        Login with Google
                    </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{" "}
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
