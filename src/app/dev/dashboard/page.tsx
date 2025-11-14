
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, PlusCircle, ShieldAlert, Gamepad2, Award, ArrowLeft, DollarSign, Users, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useGameStore } from '@/context/game-store-context';
import { collection, query, where } from 'firebase/firestore';
import type { Game } from '@/lib/types';


function DevDashboardPageContent() {
  const { user, isUserLoading } = useUser();
  const { isPurchased, purchasedGames } = useGameStore();
  const router = useRouter();
  const { firestore } = useFirebase();

  const myGamesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'games'), where("developerId", "==", user.uid));
  }, [firestore, user]);
    
  const { data: myGames, isLoading: isLoadingGames } = useCollection(myGamesQuery);
  
  const isLoading = isUserLoading || purchasedGames === undefined || isLoadingGames;
  const hasDevLicense = isPurchased('dev-account-upgrade') || isPurchased('dev-android-account-upgrade');

  useEffect(() => {
    // If we're done loading and the user is not logged in OR doesn't have the license, redirect.
    if (!isLoading && (!user || !hasDevLicense)) {
      router.push('/apply-for-dev');
    }
  }, [isLoading, user, hasDevLicense, router]);

  // Show a loading state while we check for the user and their purchases.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // This check is for after loading is complete. If they still don't have the license,
  // show the access denied message before the redirect happens.
  if (!user || !hasDevLicense) {
       return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
            <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You need a publisher license to access this page.</p>
            <Button asChild className="mt-6">
                <Link href="/apply-for-dev">Get License</Link>
            </Button>
      </div>
    );
  }
  
  const totalGames = myGames?.length || 0;
  const totalRevenue = (myGames?.reduce((acc, game) => acc + (game.price || 0), 0) || 0) * 123; // Placeholder multiplier
  const totalSales = totalGames * 123; // Placeholder
  const totalDownloads = totalGames * 456; // Placeholder

  // If loading is done and the user has the license, show the dashboard.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container py-12">
          <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Publisher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Submit and manage your games.</p>
          <Button asChild variant="link" className="p-0 text-accent mt-2">
              <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Store
              </Link>
          </Button>
          
           <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across all {totalGames} games</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalSales}</div>
                    <p className="text-xs text-muted-foreground">Total unique purchases</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{totalDownloads}</div>
                    <p className="text-xs text-muted-foreground">From all purchases</p>
                </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="hover:border-primary transition-colors md:col-span-1 lg:col-span-1">
                <Link href="/dev/submit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PlusCircle className="text-accent"/>Submit New Game</CardTitle>
                        <CardDescription>Send a new game for review and release on the store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 text-accent">Start Submission</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card className="hover:border-primary transition-colors">
                <Link href="/dev/my-games">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-accent" />My Games</CardTitle>
                        <CardDescription>View the status and statistics of your submitted games.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="link" className="p-0 text-accent">Manage Games</Button>
                    </CardContent>
                </Link>
             </Card>
             <Card className="hover:border-primary transition-colors">
                <Link href="/apply-for-dev">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award className="text-accent" />Manage Licenses</CardTitle>
                        <CardDescription>Upgrade or purchase additional licenses, like the Android publisher license.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="link" className="p-0 text-accent">View Licenses</Button>
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

export default function DevDashboardPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <DevDashboardPageContent />
        </Suspense>
    )
}
