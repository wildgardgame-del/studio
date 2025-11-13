
'use client';

import { Suspense, useState } from 'react';
import { useFirebase } from '@/firebase'; // Alterado de useUser para useFirebase
import { Loader2, ShieldPlus } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Admin } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AdminDebugPageContent() {
  const { user, isUserLoading, firestore } = useFirebase(); // Corrigido para useFirebase()
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);

  const handleBecomeAdmin = async () => {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: "User or firestore not available. Please wait and try again."
        });
        return;
    }

    setIsPromoting(true);

    try {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminData: Omit<Admin, 'addedAt'> = {
            email: user.email!,
            role: 'Admin',
        };
        await setDoc(adminDocRef, { ...adminData, addedAt: serverTimestamp() });
        
        toast({
            title: "Success!",
            description: "You have been promoted to the first Admin. The page will now reload."
        });
        
        setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "Could not become first admin. Check Firestore rules and console."
        });
    } finally {
        setIsPromoting(false);
    }
  }

  const isLoading = isUserLoading;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold font-headline mb-8">Admin Status Debug</h1>
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
        ) : (
          <div className="font-mono text-lg space-y-4 bg-gray-900 p-6 rounded-lg border border-cyan-400/30 max-w-4xl w-full">
            <p>
              <span className="text-gray-400">Current User: </span>
              <span className="font-bold text-yellow-400">{user?.email}</span>
            </p>
            <Separator className="bg-cyan-400/20 my-4" />
            
             <Card className="bg-yellow-900/20 border-yellow-500/50 text-yellow-300 text-left">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-mono">
                        <ShieldPlus />
                        Ação Necessária
                    </CardTitle>
                        <CardDescription className="text-yellow-400/80 font-mono">
                        Se não houver administradores no sistema, use este botão para se tornar o primeiro.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleBecomeAdmin} 
                        disabled={!user || !firestore || isPromoting}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                        {(isPromoting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tornar-me o Primeiro Administrador
                    </Button>
                </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function AdminDebugPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AdminDebugPageContent />
        </Suspense>
    )
}
