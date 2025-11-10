'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Game } from '@/lib/types';


export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  
  const { firestore } = useFirebase();

  const gameRef = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return doc(firestore, 'games', gameId);
  }, [firestore, gameId]);
  
  const { data: game, isLoading } = useDoc<Game>(gameRef);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
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
        <div className="container py-8">
            <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">{game.title}</h1>
            <Image
                src={game.coverImage || 'https://placehold.co/600x800'}
                alt={`Cover for ${game.title}`}
                width={600}
                height={800}
                className="rounded-lg object-cover aspect-[3/4] w-full max-w-sm mt-4"
            />
        </div>
      </main>
      <Footer />
    </div>
  );
}
