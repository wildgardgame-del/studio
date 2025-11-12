
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, setPersistence, browserLocalPersistence, signInWithPopup } from "firebase/auth";
import { Loader2, CalendarIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { format, isBefore, subYears } from 'date-fns';

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
    const [isAdult, setIsAdult] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleDateSelect = (date: Date | undefined) => {
        setDateOfBirth(date);
        if (date) {
            const eightteenYearsAgo = subYears(new Date(), 18);
            setIsAdult(isBefore(date, eightteenYearsAgo));
        } else {
            setIsAdult(null);
        }
    }

    const handleGoogleSignUp = async () => {
        if (!auth || !dateOfBirth) return;
        setIsSigningUp(true);

        // Store DOB in session storage to be picked up after redirect
        sessionStorage.setItem('pending_dob', dateOfBirth.toISOString());

        const provider = new GoogleAuthProvider();

        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, provider);

            toast({
                title: "Account Created!",
                description: "Welcome to GameSphere!",
            });
            // The onAuthStateChanged listener in the provider will handle profile creation
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
            sessionStorage.removeItem('pending_dob'); // Clean up on failure
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
                            Please enter your date of birth to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateOfBirth && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateOfBirth}
                                        onSelect={handleDateSelect}
                                        captionLayout="dropdown-buttons"
                                        fromYear={1920}
                                        toYear={new Date().getFullYear()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            
                            {isAdult === true && (
                                <>
                                 <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Confirm Your Age</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        By creating an account, you confirm that you are over 18. Providing false information may result in a permanent ban.
                                    </AlertDescription>
                                </Alert>
                                <Button onClick={handleGoogleSignUp} className="w-full" disabled={isSigningUp}>
                                    {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign Up with Google
                                </Button>
                                </>
                            )}
                            
                            {isAdult === false && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Age Restriction</AlertTitle>
                                    <AlertDescription>
                                        You must be at least 18 years old to create an account.
                                    </AlertDescription>
                                </Alert>
                            )}

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
