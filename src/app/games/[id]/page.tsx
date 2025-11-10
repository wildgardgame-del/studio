'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import React from 'react';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import type { Game } from '@/lib/types';

export default function GamePage() {
  const { firestore } = useFirebase();
  const params = useParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id;

  const docRef = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);

  const { data: game, isLoading } = useDoc<Game>(docRef);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!game) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12 text-center">
          <h1 className="text-4xl font-bold font-headline mb-8">{game.title}</h1>
          <Button asChild>
            <Link href="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a Loja
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
