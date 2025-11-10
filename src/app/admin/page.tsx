'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  // Hardcoded admin check based on email
  const isAdmin = user?.email === 'ronneeh@gmail.com';

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/');
    }
  }, [isUserLoading, isAdmin, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
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
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Painel de Administração</h1>
          <p className="text-muted-foreground mt-2">Gerencie sua loja, aprove jogos e muito mais.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/developers">
                    <CardHeader>
                        <CardTitle>Gerenciar Jogos</CardTitle>
                        <CardDescription>Aprove ou rejeite jogos enviados por desenvolvedores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">Revisar Submissões</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>Visualize e edite as roles dos usuários.</CardDescription>
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
