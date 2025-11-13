
'use client';

import { Suspense } from 'react';
import { useUser } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

function AdminDebugPageContent() {
  const { user, isUserLoading, firestore } = useUser();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      
      // This is the definitive check. It only checks for the existence
      // of the user's document in the /admins collection.
      const adminDocRef = doc(firestore, 'admins', user.uid);
      try {
        const adminDoc = await getDoc(adminDocRef);
        return adminDoc.exists();
      } catch (error) {
        console.error("Error checking admin status:", error);
        // An error here likely means a permission issue still exists,
        // so we fail safely to `false`.
        return false;
      }
    },
    enabled: !!user && !!firestore, // Only run the query if we have a user and Firestore instance.
  });

  const isLoading = isUserLoading || isAdminLoading;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold font-headline mb-8">Admin Status Debug</h1>
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
        ) : (
          <div className="font-mono text-lg space-y-4 bg-gray-900 p-6 rounded-lg border border-cyan-400/30">
            <p>
              <span className="text-gray-400">User Logged In: </span>
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
                  <span className="font-bold text-yellow-400">{user.uid}</span>
                </p>
              </>
            )}
            <p className="text-2xl">
              <span className="text-gray-400">Is Admin: </span>
              <span className={isAdmin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {isAdmin ? 'true' : 'false'}
              </span>
            </p>
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
