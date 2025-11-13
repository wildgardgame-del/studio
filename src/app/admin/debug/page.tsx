
'use client';

import { Suspense, useState } from 'react';
import { useUser } from '@/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const { user, isUserLoading, firestore } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);

  const { data: adminStatus, isLoading: isAdminLoading } = useQuery({
    queryKey: ['adminStatus', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return { isAdmin: false, role: null, docExists: false };
      
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      
      const docExists = adminDoc.exists();
      const role = docExists ? adminDoc.data().role : null;
      const isAdmin = docExists && role === 'Admin';
      
      return { isAdmin, role, docExists };
    },
    enabled: !!user && !!firestore,
  });

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
        
        await queryClient.invalidateQueries({ queryKey: ['adminStatus', user?.uid] });

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

  const isLoading = isUserLoading || isAdminLoading;

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
             <p className="text-xl">
              <span className="text-gray-400">1. Document Exists in /admins/{user?.uid} ? </span>
              <span className={adminStatus?.docExists ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {adminStatus?.docExists ? 'true' : 'false'}
              </span>
            </p>
             <p className="text-xl">
              <span className="text-gray-400">2. Document has field 'role' == "Admin" ? </span>
               <span className={adminStatus?.role === 'Admin' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {adminStatus?.role ? `true (role is "${adminStatus.role}")` : 'false'}
              </span>
            </p>
            <Separator className="bg-cyan-400/20 my-4" />
            <p className="text-2xl">
              <span className="text-gray-400">Final isAdmin() Result: </span>
              <span className={adminStatus?.isAdmin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {adminStatus?.isAdmin ? 'true' : 'false'}
              </span>
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
