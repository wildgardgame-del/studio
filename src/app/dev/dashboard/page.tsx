
'use client';

import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, ShieldAlert, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DevDashboardPage() {
  const { role, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role !== 'dev' && role !== 'admin') {
      router.push('/');
    }
  }, [isLoading, role, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== 'dev' && role !== 'admin') {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
            <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
            <Button asChild className="mt-6">
                <Link href="/">Voltar para a Loja</Link>
            </Button>
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
