
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, PlusCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/useRole';
import { useGameStore } from '@/context/game-store-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevDashboardPage() {
  const { role, isLoading: isRoleLoading } = useRole();
  const { isPurchased } = useGameStore();
  const router = useRouter();

  const hasDevLicense = isPurchased('dev-account-upgrade');
  const isDev = role === 'dev' || role === 'admin';
  const hasAccess = isDev || hasDevLicense;
  
  const isLoading = isRoleLoading; // Add other loading states if needed e.g. from isPurchased

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      // Optional: redirect to a specific "access-denied" page
      // For now, we'll just show the message
    }
  }, [isLoading, hasAccess, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
     return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
                <h1 className="text-3xl font-bold">Acesso Negado</h1>
                <p className="text-muted-foreground mt-2 max-w-md">Você não tem a Licença de Desenvolvedor para acessar esta página. Adquira uma para começar a publicar.</p>
                <Button asChild className="mt-6">
                    <Link href="/apply-for-dev">Obter Licença de Desenvolvedor</Link>
                </Button>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Painel de Desenvolvedor</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus jogos e veja suas estatísticas.</p>

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
