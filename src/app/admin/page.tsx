
'use client';

import { useUser, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, ShieldAlert, Gamepad2, Bell, Users, Inbox } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';


function AdminDashboardPageContent() {
  const { user, isUserLoading, firestore } = useUser();
  const router = useRouter();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists() || user.email === 'forgegatehub@gmail.com';
    },
    enabled: !!user && !!firestore,
  });

  const isLoading = isUserLoading || isAdminLoading;
  
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-games-count'],
    queryFn: async () => {
      if (!firestore || !isAdmin) return 0;
      const q = query(collection(firestore, 'games'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.size;
    },
    enabled: !!firestore && isAdmin,
    refetchInterval: 30000,
  });
  
  const { data: unreadMessageCount } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
        if (!firestore || !isAdmin) return 0;
        const q = query(collection(firestore, 'admin_messages'), where('isRead', '==', false));
        const snapshot = await getDocs(q);
        return snapshot.size;
    },
    enabled: !!firestore && isAdmin,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
            <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have permission to access this page.</p>
            <Button asChild className="mt-6">
                <Link href="/">Back to Store</Link>
            </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your store, approve games, and more.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/games">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-accent"/>Manage Games</CardTitle>
                            {pendingCount !== undefined && pendingCount > 0 && (
                               <Badge className="bg-accent text-accent-foreground">{pendingCount}</Badge>
                            )}
                        </div>
                        <CardDescription>Approve or reject games submitted by developers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">Review Submissions</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/notifications">
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><Bell className="text-accent"/>Send Notification</CardTitle>
                       <CardDescription>Send notifications to all or selected users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">Create Notification</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/users">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Users className="text-accent"/>Manage Users</CardTitle>
                      <CardDescription>View and manage all registered users.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button variant="link" className="p-0 text-accent">View Users</Button>
                  </CardContent>
                </Link>
             </Card>
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/inbox">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Inbox className="text-accent"/>Inbox</CardTitle>
                            {unreadMessageCount !== undefined && unreadMessageCount > 0 && (
                               <Badge className="bg-accent text-accent-foreground">{unreadMessageCount}</Badge>
                            )}
                        </div>
                        <CardDescription>View and manage messages from users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">View Messages</Button>
                    </CardContent>
                </Link>
             </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AdminDashboardPageContent />
        </Suspense>
    )
}
