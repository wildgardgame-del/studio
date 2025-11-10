'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

export default function GamePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex flex-1 flex-col items-center justify-center py-12 text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Página em Manutenção</h1>
        <p className="text-muted-foreground mb-8">Estamos a trabalhar para melhorar esta página. Volte em breve!</p>
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
