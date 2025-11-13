
'use client';

import { Suspense } from 'react';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function AdminDebugPageContent() {
  const { user, isUserLoading, firestore } = useUser();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      const adminDocRef = doc(firestore, 'admins', user.uid);
      try {
        const adminDoc = await getDoc(adminDocRef);
        // This is the definitive check based on our agreed logic.
        return adminDoc.exists();
      } catch (error) {
        console.error("Error checking admin status:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `admins/${user.uid}`,
            operation: 'get',
        }));
        return false;
      }
    },
    enabled: !!user && !!firestore,
  });

  const { data: allUsers, isLoading: isAllUsersLoading, error: allUsersError } = useQuery({
    queryKey: ['allUsersForDebug'],
    queryFn: async () => {
      if (!firestore) return [];
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email, username: doc.data().username }));
    },
    enabled: !!firestore,
  });

  const { data: allAdmins, isLoading: isAllAdminsLoading, error: allAdminsError } = useQuery({
    queryKey: ['allAdminsForDebug'],
    queryFn: async () => {
      if (!firestore) return [];
      const adminsRef = collection(firestore, 'admins');
      const snapshot = await getDocs(adminsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email, role: doc.data().role }));
    },
    enabled: !!firestore,
  });

  const isLoading = isUserLoading || isAdminLoading || isAllUsersLoading || isAllAdminsLoading;

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
              <span className="text-gray-400">Is Admin (Client-Side Check): </span>
              <span className={isAdmin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {isAdminLoading ? 'Checking...' : isAdmin ? 'true' : 'false'}
              </span>
            </p>
            <Separator className="bg-cyan-400/20 my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl text-cyan-400">All User IDs in '/users'</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAllUsersLoading && <Loader2 className="h-6 w-6 animate-spin" />}
                        {allUsersError && <p className="text-red-400 text-xs break-all">Error fetching users: {(allUsersError as Error).message}</p>}
                        {allUsers && (
                            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                                {allUsers.map(u => <li key={u.id} className="break-all">{u.id} ({u.username})</li>)}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                 <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl text-cyan-400">All Admin IDs in '/admins'</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isAllAdminsLoading && <Loader2 className="h-6 w-6 animate-spin" />}
                        {allAdminsError && <p className="text-red-400 text-xs break-all">Error fetching admins: {(allAdminsError as Error).message}</p>}
                        {allAdmins && allAdmins.length > 0 ? (
                            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                                {allAdmins.map(admin => <li key={admin.id} className="break-all">{admin.id} ({admin.email})</li>)}
                            </ul>
                        ) : allAdmins && (
                            <p className="text-yellow-400">The '/admins' collection is empty.</p>
                        )}
                    </CardContent>
                </Card>
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
