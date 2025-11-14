
'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/context/game-store-context';
import { useDoc, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Game } from '@/lib/types';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Loader2, ShieldAlert, ArrowLeft, BarChart2, DollarSign, Users, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, Bar, AreaChart, Area } from 'recharts';

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--accent))",
  },
}

function GameStatsPageContent() {
    const { user, isUserLoading } = useUser();
    const { isPurchased, purchasedGames } = useGameStore(); // We can use this to see if the dev owns the license
    const router = useRouter();
    const params = useParams();
    const gameId = params.id as string;
    const { firestore } = useFirebase();

    const hasDevLicense = isPurchased('dev-account-upgrade') || isPurchased('dev-android-account-upgrade');
    
    // Authorization checks
    useEffect(() => {
        const isPageLoading = isUserLoading || purchasedGames === undefined;
        if (!isPageLoading && (!user || !hasDevLicense)) {
            router.push('/apply-for-dev');
        }
    }, [isUserLoading, purchasedGames, user, hasDevLicense, router]);

    const gameRef = useMemoFirebase(() => {
        if (!firestore || !gameId) return null;
        return doc(firestore, 'games', gameId);
    }, [firestore, gameId]);

    const { data: gameData, isLoading: isGameLoading } = useDoc<Game>(gameRef);

    const isLoading = isUserLoading || isGameLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // Final authorization check after data loads
    if (!user || !hasDevLicense || !gameData || gameData.developerId !== user.uid) {
         return (
           <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
               <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2 max-w-md">
                    { !user ? "You must be logged in." :
                      !hasDevLicense ? "You need a publisher license." :
                      "You do not have permission to view stats for this game."
                    }
                </p>
                <Button asChild className="mt-6">
                    <Link href={!user ? "/login" : "/dev/dashboard"}>
                        { !user ? "Login" : "Back to Dashboard" }
                    </Link>
                </Button>
           </div>
      )
    }

    // Placeholder stats
    const totalRevenue = gameData.price * 123;
    const totalSales = 123;
    const totalDownloads = 456;
    const pageViews = 7890;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary/30">
                <div className="container py-12">
                    <div>
                        <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">Game Analytics</h1>
                        <p className="text-muted-foreground mt-2">Performance and statistics for {gameData.title}.</p>
                        <Button asChild variant="link" className="p-0 text-accent mt-2">
                            <Link href="/dev/my-games">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to My Games
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Based on {totalSales} sales</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{totalSales}</div>
                                <p className="text-xs text-muted-foreground">Unique purchases</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{totalDownloads}</div>
                                <p className="text-xs text-muted-foreground">Across all sales</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pageViews.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Total visits to your game page</p>
                            </CardContent>
                        </Card>
                    </div>

                     <div className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Over Time</CardTitle>
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
                                        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Page Views Over Time</CardTitle>
                                <CardDescription>January - June 2024</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                                    <AreaChart
                                        accessibilityLayer
                                        data={chartData}
                                        margin={{
                                        left: 12,
                                        right: 12,
                                        }}
                                    >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                        />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                        <Area
                                        dataKey="mobile"
                                        type="natural"
                                        fill="var(--color-mobile)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-mobile)"
                                        stackId="a"
                                        />
                                        <Area
                                        dataKey="desktop"
                                        type="natural"
                                        fill="var(--color-desktop)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-desktop)"
                                        stackId="a"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}


export default function GameStatsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <GameStatsPageContent />
        </Suspense>
    )
}
