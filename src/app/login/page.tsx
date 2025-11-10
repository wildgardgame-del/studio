'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";

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
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Google Sign-In cancelled by user.");
      } else {
        console.error("Error signing in with Google: ", error);
        toast({
          variant: "destructive",
          title: "Login Falhou",
          description: error.message || "Ocorreu um erro inesperado durante o login com o Google.",
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <p>Carregando...</p>
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
                    <CardTitle className="text-2xl font-headline text-center">Login no GameSphere</CardTitle>
                    <CardDescription className="text-center">
                    Digite seu e-mail abaixo para fazer login em sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                        id="email"
                        type="email"
                        placeholder="m@exemplo.com"
                        required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                        <Label htmlFor="password">Senha</Label>
                        <Link href="#" className="ml-auto inline-block text-sm underline">
                            Esqueceu sua senha?
                        </Link>
                        </div>
                        <Input id="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSigningIn}>
                        {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login com Google
                    </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                    Não tem uma conta?{" "}
                    <Link href="/signup" className="underline">
                        Cadastre-se
                    </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  )
}
