
'use client';

import Link from 'next/link';
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  Library,
  LogOut,
  Shield,
  PlusCircle,
  Award,
  Bell,
  CheckCheck,
  MessageSquare,
  FlaskConical,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, doc, updateDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';


import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Cart } from '@/components/cart';
import { useGameStore } from '@/context/game-store-context';
import { useUser, useFirebase, useMemoFirebase, useQuery, useCollection } from '@/firebase';
import Image from 'next/image';
import type { Notification } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from '../ui/separator';

const navLinks = [
  { href: '/browse', label: 'Store', activeColorClass: 'text-primary', icon: ShoppingCart },
  { href: '/lab', label: 'Lab', activeColorClass: 'text-accent', icon: FlaskConical },
  { href: '/library', label: 'Library', activeColorClass: 'text-accent', icon: Library },
];

function NotificationsMenu() {
    const { user, firestore } = useFirebase();
    const queryClient = useQueryClient();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'), limit(10));
    }, [user, firestore]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);
    
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            if (!user || !firestore) throw new Error("Missing user or firestore");
            const notifRef = doc(firestore, `users/${user.uid}/notifications`, notificationId);
            return updateDoc(notifRef, { isRead: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.uid] });
        }
    });
    
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
             if (!user || !firestore || !notifications) throw new Error("Missing user, firestore or notifications");
             const batch = (await import('firebase/firestore')).writeBatch(firestore);
             notifications.forEach(n => {
                if (!n.isRead) {
                    const notifRef = doc(firestore, `users/${user.uid}/notifications`, n.id);
                    batch.update(notifRef, { isRead: true });
                }
             });
             return batch.commit();
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications', user?.uid] });
        }
    })

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">{unreadCount}</span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Notifications
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notification => (
                            <DropdownMenuItem key={notification.id} asChild onSelect={(e) => e.preventDefault()}>
                                <Link href={notification.link || '#'}
                                      className={cn("flex flex-col items-start gap-1 p-2", !notification.isRead && "bg-secondary")}
                                      onClick={() => handleNotificationClick(notification)}
                                >
                                    <p className="font-semibold text-sm">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground whitespace-normal">{notification.message}</p>
                                     <p className="text-xs text-muted-foreground/70 self-end">
                                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.seconds * 1000, { addSuffix: true }) : ''}
                                    </p>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">You have no new notifications.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function Header() {
  const { cartItems, wishlistItems, isPurchased } = useGameStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isUserLoading, firestore } = useFirebase();
  
  const hasDevLicense = isPurchased('dev-account-upgrade');
  
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


  useEffect(() => {
    const q = searchParams.get('q');
    setSearchQuery(q || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim() === '') {
      router.push('/browse');
    } else {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setIsMobileMenuOpen(false);
    router.push('/');
  }

  const getAvatarFallback = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        <div className="flex md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 flex flex-col">
                <Link
                href="/"
                className="mb-4 flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
                >
                <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={32} height={32} className="mr-2" />
                <span className="font-bold font-headline">Forge Gate Hub</span>
                </Link>
                <div className="flex flex-col space-y-3">
                  {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            pathname === link.href
                            ? `bg-muted ${link.activeColorClass}`
                            : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                  ))}
                  <Link
                      href="/wishlist"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/wishlist"
                        ? "bg-muted text-foreground"
                        : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      >
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </Link>
                    {user && hasDevLicense && (
                        <Link
                            href="/dev/dashboard"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-yellow-500 transition-colors hover:bg-muted/50 hover:text-yellow-400"
                            onClick={() => setIsMobileMenuOpen(false)}
                            >
                            <PlusCircle className="h-4 w-4" />
                            Dev Dashboard
                        </Link>
                    )}
                    {user && !hasDevLicense && (
                        <Link
                            href="/apply-for-dev"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                            >
                            <Award className="h-4 w-4" />
                            Become a Publisher
                        </Link>
                    )}
                    {isAdmin && (
                       <>
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-orange-500 transition-colors hover:bg-muted/50 hover:text-orange-400"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                       </>
                    )}
                </div>

                <div className="mt-auto">
                  <Separator className="my-4" />
                  {isUserLoading ? (
                     <div className='h-10 w-full rounded-md bg-muted animate-pulse' />
                  ) : user ? (
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-3 px-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                          </div>
                       </div>
                       <Separator className="my-2" />
                       <Button variant="ghost" className="justify-start" asChild>
                            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                                <MessageSquare className="mr-2 h-4 w-4"/> Contact Us
                            </Link>
                        </Button>
                       <Button variant="ghost" className="justify-start text-red-500 hover:text-red-400" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" /> Logout
                       </Button>
                    </div>
                  ) : (
                    <div className="px-4">
                        <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href="/login">Login</Link>
                        </Button>
                    </div>
                  )}
                </div>
            </SheetContent>
            </Sheet>
        </div>

        {/* Desktop Header */}
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center space-x-2">
                    <Image src="/images/ForgegateLogo128.png" alt="Forge Gate Hub Logo" width={32} height={32} />
                    <span className="hidden font-bold sm:inline-block font-headline">
                        Forge Gate Hub
                    </span>
                </Link>
                
                <nav className="hidden md:flex items-center space-x-4">
                    {navLinks.map((link) => (
                      <Link
                          key={link.href}
                          href={link.href}
                           className={cn(
                              "flex items-center gap-2 px-3 py-1.5 transition-colors text-sm font-semibold",
                              pathname === link.href
                              ? `${link.activeColorClass}`
                              : "text-muted-foreground hover:text-foreground"
                          )}
                      >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                      </Link>
                    ))}
                </nav>
            </div>


            <div className="flex flex-1 items-center justify-end space-x-2">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                    <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search games..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </form>
                </div>
                <nav className="hidden md:flex items-center gap-1">
                    <Link href="/wishlist">
                        <Button variant="ghost" size="icon" className="relative">
                            <Heart className="h-5 w-5" />
                            {wishlistItems.length > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{wishlistItems.length}</span>
                            )}
                            <span className="sr-only">Wishlist</span>
                        </Button>
                    </Link>

                    <Cart>
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {cartItems.length > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{cartItems.length}</span>
                            )}
                            <span className="sr-only">Shopping Cart</span>
                        </Button>
                    </Cart>

                    {(isUserLoading || isAdminLoading) ? (
                        <div className='h-8 w-8 rounded-full bg-muted animate-pulse' />
                    ) : user ? (
                        <>
                            <NotificationsMenu />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                                            <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem asChild>
                                        <Link href="/library"><Library className="mr-2 h-4 w-4" />Library</Link>
                                    </DropdownMenuItem>
                                    
                                    {hasDevLicense ? (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dev/dashboard" className="text-yellow-500 hover:!text-yellow-400 focus:!bg-yellow-500/10 focus:!text-yellow-400">
                                                <PlusCircle className="mr-2 h-4 w-4" />Dev Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem asChild>
                                            <Link href="/apply-for-dev"><Award className="mr-2 h-4 w-4" />Become a Publisher</Link>
                                        </DropdownMenuItem>
                                    )}

                                    {isAdmin && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin" className="text-orange-500 hover:!text-orange-400 focus:!bg-orange-500/10 focus:!text-orange-400">
                                                <Shield className="mr-2 h-4 w-4" />Admin Panel
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem asChild>
                                        <Link href="/contact"><MessageSquare className="mr-2 h-4 w-4" />Contact Us</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" size="icon">
                                <User className="h-5 w-5" />
                                <span className="sr-only">User Profile</span>
                            </Button>                        </Link>
                    )}
                </nav>
                <div className="md:hidden">
                    <Cart>
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {cartItems.length > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{cartItems.length}</span>
                            )}
                            <span className="sr-only">Shopping Cart</span>
                        </Button>
                    </Cart>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
}
