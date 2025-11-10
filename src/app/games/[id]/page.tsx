'use client';

import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="container text-center">
          <h1 className="text-2xl font-bold font-headline mb-4">Página em Manutenção</h1>
          <p className="text-muted-foreground mb-6">Esta página de jogo está a ser afinada. Por favor, volte mais tarde.</p>
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
