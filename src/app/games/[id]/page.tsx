'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { Game } from '@/lib/types';

export default function GamePage() {
  const params = useParams();
  const id = params.id as string;
  const { firestore } = useFirebase();

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'games', id);
  }, [firestore, id]);

  const { data: game, isLoading } = useDoc<Game>(gameRef);

  // 1. Estado de Carregamento
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">A carregar os detalhes do jogo...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Jogo Encontrado
  if (game) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
          <h1 className="text-4xl font-bold font-headline mb-8">{game.title}</h1>
          <Button asChild>
            <Link href="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Loja
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Jogo NÃO encontrado (sem erro 404)
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold font-headline mb-8">Jogo não encontrado.</h1>
        <p className="text-muted-foreground mb-8">Não foi possível carregar os detalhes para este jogo.</p>
        <Button asChild>
          <Link href="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Loja
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}