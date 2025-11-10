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
  Gamepad2,
  Moon,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { useTheme } from "next-themes";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
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
import { Icons } from '../icons';
import { useGameStore } from '@/context/game-store-context';
import { useUser } from '@/firebase';

const navLinks = [
  { href: '/browse', label: 'Store' },
  { href: '/library', label: 'Library' },
];

export default function Header() {
  const { cartItems, wishlistItems, isPurchased } = useGameStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isUserLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  const hasDevLicense = isPurchased('dev-account-upgrade');

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
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  }

  const getAvatarFallback = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  const toggleTheme = () => {
    setTheme(theme === 'theme-cyberpunk' ? 'theme-dark-default' : 'theme-cyberpunk');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex md:hidden">
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
            <SheetContent side="left" className="pr-0">
                <Link
                href="/"
                className="mb-4 flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
                >
                <Icons.Logo className="mr-2 h-6 w-6 text-accent" />
                <span className="font-bold font-headline">Forge Gate Hub</span>
                </Link>
                <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    {link.label}
                    </Link>
                ))}
                <Link
                    href="/wishlist"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    Wishlist
                    </Link>
                    {user && hasDevLicense && (
                        <Link
                            href="/dev/dashboard"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                            onClick={() => setIsMobileMenuOpen(false)}
                            >
                            Dev Dashboard
                        </Link>
                    )}
                    {user && !hasDevLicense && (
                        <Link
                            href="/apply-for-dev"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                            onClick={() => setIsMobileMenuOpen(false)}
                            >
                            Become a Publisher
                        </Link>
                    )}
                </div>
            </SheetContent>
            </Sheet>
        </div>

        <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Icons.Logo className="h-6 w-6 text-accent" />
                    <span className="hidden font-bold sm:inline-block font-headline">
                    Forge Gate Hub
                    </span>
                </Link>
            </div>

            <div className="hidden md:flex flex-1 justify-center">
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
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
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>

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

                {isUserLoading ? (
                <div className='h-8 w-8 rounded-full bg-muted animate-pulse' />
                ) : user ? (
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
                        <>
                        <DropdownMenuItem asChild>
                            <Link href="/dev/dashboard"><PlusCircle className="mr-2 h-4 w-4" />Dev Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dev/my-games"><Gamepad2 className="mr-2 h-4 w-4" />My Games</Link>
                        </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem asChild>
                            <Link href="/apply-for-dev"><Award className="mr-2 h-4 w-4" />Become a Publisher</Link>
                        </DropdownMenuItem>
                    )}

                    {user.email === 'ronneeh@gmail.com' && (
                        <DropdownMenuItem asChild>
                        <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                        </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                <Link href="/login">
                    <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User Profile</span>
                    </Button>
                </Link>
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
