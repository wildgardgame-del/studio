
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { Loader2, ShieldPlus, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';
import { doc, getDocs, collection, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Admin } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AdminDebugPageContent() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showClearSalesDialog, setShowClearSalesDialog] = useState(false);

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

  const clearSalesMutation = useMutation({
    mutationFn: async () => {
      if (!firestore) throw new Error("Firestore not available");
      const salesRef = collection(firestore, 'sales');
      const salesSnapshot = await getDocs(salesRef);
      
      if (salesSnapshot.empty) {
        toast({ title: 'No sales to clear.' });
        return;
      }
      
      const batch = writeBatch(firestore);
      salesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    },
    onSuccess: () => {
      toast({
        title: "Sales Data Cleared!",
        description: "All sales records have been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['global-admin-stats'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error Clearing Sales",
        description: error.message || "An unexpected error occurred.",
      });
    },
    onSettled: () => {
      setShowClearSalesDialog(false);
    }
  });
  
  const isLoading = isUserLoading || isAdminLoading;

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/admin');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
      return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    {/* Clear Sales Dialog */}
    <AlertDialog open={showClearSalesDialog} onOpenChange={setShowClearSalesDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will permanently delete ALL sales records from the database. This is irreversible and will reset the Total Revenue counter to $0.00.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => clearSalesMutation.mutate()}
                className={cn(buttonVariants({ variant: "destructive" }))}
                disabled={clearSalesMutation.isPending}
            >
                {clearSalesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, delete all sales
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>


    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center p-8">
        <h1 className="text-4xl font-bold font-headline mb-2">Admin Debug Zone</h1>
        <p className="text-muted-foreground mb-8">Tools for managing and resetting test data.</p>
        
        <div className="space-y-6 max-w-2xl w-full">
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 />
                        Clear Sales Data
                    </CardTitle>
                    <CardDescription>
                        Permanently delete all sales transaction records. This is useful for resetting revenue statistics before a production launch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={() => setShowClearSalesDialog(true)}
                        variant="destructive"
                    >
                        Clear All Sales Records
                    </Button>
                </CardContent>
            </Card>

            <Button asChild variant="link" className="text-accent">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin Dashboard
                </Link>
            </Button>
        </div>

      </main>
      <Footer />
    </div>
    </>
  );
}

export default function AdminDebugPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <AdminDebugPageContent />
        </Suspense>
    )
}
