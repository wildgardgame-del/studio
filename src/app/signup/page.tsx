
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, updateProfile } from "firebase/auth";
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
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import heroImage from '@/lib/placeholder-images.json';
import Link from "next/link";


const signupFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningUp, setIsSigningUp] = useState(false);
    
    const form = useForm<z.infer<typeof signupFormSchema>>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleEmailSignUp = async (values: z.infer<typeof signupFormSchema>) => {
        if (!auth) return;
        setIsSigningUp(true);
        try {
            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            
            // After creating the user, update their profile with the username
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: values.username,
                });
            }

            toast({
                title: "Account Created!",
                description: "Welcome to GameSphere!",
            });
            // The onAuthStateChanged listener in the provider will handle profile creation
            // and redirect to the homepage.
            router.push('/');

        } catch (error: any) {
            console.error("Error signing up with email: ", error);
            let description = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                description = "This email is already registered. Please try to log in instead.";
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
                            Enter your details below to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEmailSignUp)} className="space-y-4">
                                <FormField control={form.control} name="username" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl><Input placeholder="Your cool name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
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
                                <Button type="submit" className="w-full" disabled={isSigningUp}>
                                    {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </form>
                        </Form>
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
