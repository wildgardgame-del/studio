
'use client';

import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, ShieldAlert, Gamepad2, Bell, Users, Inbox, ArrowLeft, Home, DollarSign, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { Game, Sale } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, Bar } from 'recharts';

const chartData = [
  { month: "January", desktop: 1860, mobile: 800 },
  { month: "February", desktop: 3050, mobile: 2000 },
  { month: "March", desktop: 2370, mobile: 1200 },
  { month: "April", desktop: 730, mobile: 1900 },
  { month: "May", desktop: 2090, mobile: 1300 },
  { month: "June", desktop: 2140, mobile: 1400 },
]

const chartConfig = {
  desktop: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Views",
    color: "hsl(var(--accent))",
  },
}


function AdminDashboardPageContent() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['isAdmin', user?.uid],
    queryFn: async () => {
      if (!user || !firestore) return false;
      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      return adminDoc.exists();
    },
    enabled: !!user && !!firestore,
  });

  const isLoading = isUserLoading || isAdminLoading;
  
  const { data: globalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['global-admin-stats'],
    queryFn: async () => {
      if (!firestore || !isAdmin) return { pendingCount: 0, unreadMessageCount: 0, totalUsers: 0, totalGames: 0, totalRevenue: 0 };
      
      const pendingGamesQuery = query(collection(firestore, 'games'), where('status', '==', 'pending'));
      const unreadMessagesQuery = query(collection(firestore, 'admin_messages'), where('isRead', '==', false));
      const usersQuery = query(collection(firestore, 'users'));
      const approvedGamesQuery = query(collection(firestore, 'games'), where('status', '==', 'approved'));
      const salesQuery = query(collection(firestore, 'sales'));

      const [pendingSnapshot, unreadSnapshot, usersSnapshot, approvedGamesSnapshot, salesSnapshot] = await Promise.all([
        getDocs(pendingGamesQuery),
        getDocs(unreadMessagesQuery),
        getDocs(usersQuery),
        getDocs(approvedGamesQuery),
        getDocs(salesQuery),
      ]);

      const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
      const totalRevenue = sales.reduce((acc, sale) => acc + (sale.priceAtPurchase || 0), 0);
      
      return {
        pendingCount: pendingSnapshot.size,
        unreadMessageCount: unreadSnapshot.size,
        totalUsers: usersSnapshot.size,
        totalGames: approvedGamesSnapshot.size,
        totalRevenue,
      };
    },
    enabled: !!firestore && isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
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
          <Button asChild variant="link" className="p-0 text-accent mt-2">
              <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Store
              </Link>
          </Button>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">${(globalStats?.totalRevenue || 0).toFixed(2)}</div>}
                    <p className="text-xs text-muted-foreground">From all game sales</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{globalStats?.totalUsers}</div>}
                    <p className="text-xs text-muted-foreground">Total registered accounts</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Games</CardTitle>
                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{globalStats?.totalGames}</div>}
                    <p className="text-xs text-muted-foreground">Live on the store</p>
                </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Global Sales</CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>New Users</CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="hover:border-primary transition-colors">
                <Link href="/admin/games">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-accent"/>Manage Games</CardTitle>
                            {globalStats && globalStats.pendingCount > 0 && (
                               <Badge className="bg-accent text-accent-foreground">{globalStats.pendingCount}</Badge>
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
                            {globalStats && globalStats.unreadMessageCount > 0 && (
                               <Badge className="bg-accent text-accent-foreground">{globalStats.unreadMessageCount}</Badge>
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

    