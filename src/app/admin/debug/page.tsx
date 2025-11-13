
'use client';

import { Suspense } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';

function AdminDebugPageContent() {
  const { user, isUserLoading } = useUser();

  // A verificação mais simples e direta possível.
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdminCheckSimpleEmail', user?.email],
    queryFn: () => {
      if (!user) return false;
      // APENAS esta comparação. Mais nada.
      return user.email === 'forgegatehub@gmail.com';
    },
    enabled: !!user,
  });


  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold font-headline mb-8">Admin Status Debug</h1>
        {isUserLoading ? (
          <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
        ) : (
          <div className="font-mono text-lg space-y-4 bg-gray-900 p-6 rounded-lg border border-cyan-400/30 max-w-4xl w-full">
            <p className="text-xl">
              <span className="text-gray-400">Current User Logged In: </span>
              <span className="font-bold">{user ? 'Yes' : 'No'}</span>
            </p>
            {user && (
              <>
                <p>
                  <span className="text-gray-400">User Email: </span>
                  <span className="font-bold text-yellow-400">{user.email}</span>
                </p>
                <p>
                  <span className="text-gray-400">User UID: </span>
                  <span className="font-bold text-yellow-400 break-all">{user.uid}</span>
                </p>
              </>
            )}
            <Separator className="bg-cyan-400/20 my-4" />
            <p className="text-2xl">
              <span className="text-gray-400">Is Admin: </span>
              <span className={isAdmin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {isAdminLoading ? 'Checking...' : isAdmin ? 'true' : 'false'}
              </span>
            </p>
             <div className="text-left text-sm pt-4">
                <h2 className="text-cyan-400 font-bold">O que isto significa:</h2>
                <p className="text-gray-300 mt-2">Esta é a verificação mais simples possível. O resultado de 'Is Admin' é baseado <span className="font-bold">apenas</span> se o seu email é 'forgegatehub@gmail.com'.</p>
                <p className="text-gray-300 mt-2">Se o resultado for <span className="text-green-400 font-bold">'true'</span>, significa que a leitura básica do seu perfil de utilizador está a funcionar corretamente.</p>
             </div>
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
