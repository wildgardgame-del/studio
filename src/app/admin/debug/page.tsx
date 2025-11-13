
'use client';

import { Suspense } from 'react';
import { useUser } from '@/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldPlus } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Admin } from '@/lib/types';

function AdminDebugPageContent() {
  const { user, isUserLoading, firestore } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const { data: isAdminsCollectionEmpty, isLoading: isAdminsCollectionLoading } = useQuery({
    queryKey: ['isAdminsCollectionEmpty'],
    queryFn: async () => {
        if (!firestore) return true;
        const adminsCollectionRef = collection(firestore, 'admins');
        const snapshot = await getDocs(adminsCollectionRef);
        return snapshot.empty;
    },
    enabled: !!firestore,
  });

  const becomeFirstAdminMutation = useMutation({
      mutationFn: async () => {
        if (!user || !firestore) throw new Error("User or firestore not available");
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminData: Omit<Admin, 'addedAt'> = {
            email: user.email!,
            role: 'Admin',
        };
        await setDoc(adminDocRef, { ...adminData, addedAt: serverTimestamp() });
      },
      onSuccess: () => {
        toast({
            title: "Success!",
            description: "You have been promoted to the first Admin."
        });
        queryClient.invalidateQueries({ queryKey: ['adminStatus', user?.uid] });
        queryClient.invalidateQueries({ queryKey: ['isAdminsCollectionEmpty'] });
      },
      onError: (error: any) => {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "Could not become first admin."
        });
      }
  })

  const isLoading = isUserLoading || isAdminLoading || isAdminsCollectionLoading;

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
            {isAdminsCollectionEmpty && user && (
                <>
                <Separator className="bg-cyan-400/20 my-4" />
                 <div className="text-left text-sm pt-4">
                    <h2 className="text-cyan-400 font-bold">Ação Necessária: Bootstrap do Administrador</h2>
                     <p className="text-gray-300 mt-2">A coleção de administradores está vazia. Como primeiro utilizador, tem uma oportunidade única de se promover a si próprio para iniciar o sistema.</p>
                     <Button
                        onClick={() => becomeFirstAdminMutation.mutate()}
                        disabled={becomeFirstAdminMutation.isPending}
                        className="mt-4"
                     >
                        {becomeFirstAdminMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldPlus className="mr-2 h-4 w-4" />}
                         Tornar-me o Primeiro Administrador
                     </Button>
                 </div>
                </>
             )}
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
