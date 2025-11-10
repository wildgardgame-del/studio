'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, PlusCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useGameStore } from '@/context/game-store-context';

export default function DevDashboardPage() {
  const { user, isUserLoading } = useUser();
  const { isPurchased, purchasedGames } = useGameStore();
  const router = useRouter();
  
  const isLoading = isUserLoading || purchasedGames === undefined;
  const hasDevLicense = isPurchased('dev-account-upgrade');

  useEffect(() => {
    // If we're done loading and the user is not logged in OR doesn't have the license, redirect.
    if (!isLoading && (!user || !hasDevLicense)) {
      router.push('/apply-for-dev');
    }
  }, [isLoading, user, hasDevLicense, router]);

  // Show a loading state while we check for the user and their purchases.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // This check is for after loading is complete. If they still don't have the license,
  // show the access denied message before the redirect happens.
  if (!user || !hasDevLicense) {
       return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
            <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você precisa de uma licença de desenvolvedor para aceder a esta página.</p>
            <Button asChild className="mt-6">
                <Link href="/apply-for-dev">Obter Licença</Link>
            </Button>
      </div>
    );
  }

  // If loading is done and the user has the license, show the dashboard.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Painel de Contribuidor</h1>
          <p className="text-muted-foreground mt-2">Submeta e gerencie os seus jogos.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="hover:border-primary transition-colors md:col-span-1 lg:col-span-1">
                <Link href="/dev/submit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PlusCircle className="text-accent"/>Submeter Novo Jogo</CardTitle>
                        <CardDescription>Envie um novo jogo para revisão e publicação na loja.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">Começar Submissão</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Meus Jogos</CardTitle>
                    <CardDescription>Visualize o status e as estatísticas dos seus jogos submetidos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Em breve...</p>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
