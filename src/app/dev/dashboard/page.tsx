
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

export default function DevDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

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
