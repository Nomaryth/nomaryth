
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Search, BookOpen, Swords, User, X, Languages, LogOut, Map as MapIcon, Bell, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/context/i18n-context";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { CommandMenu } from "../command-menu";
import { Progress } from "../ui/progress";

const navLinks = [
  { href: "/", labelKey: "nav.home", icon: <Swords className="h-5 w-5" /> },
  { href: "/docs", labelKey: "nav.docs", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/map", labelKey: "nav.map", icon: <MapIcon className="h-5 w-5" /> },
  { href: "/projects", labelKey: "nav.projects", icon: <Swords className="h-5 w-5" /> },
];

function LanguageSwitcher() {
  const { setLanguage } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')}>
          English (USA)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('pt')}>
          Português (BR)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserNav() {
  const { user, loading, isAdmin } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || 'User'} />
              <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('header.profile')}</span>
            </DropdownMenuItem>
            {isAdmin && (
               <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>{t('profile.admin.title')}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('header.logout')}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
     <Button asChild>
      <Link href="/login">
        {t('login.title')}
      </Link>
    </Button>
  )
}


export function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [openCommandMenu, setOpenCommandMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("flex items-center gap-4 lg:gap-6", className)}>
      {navLinks.map(({ href, labelKey }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "transition-colors text-lg lg:text-sm hover:text-accent",
            pathname === href || (href.startsWith('/docs') && pathname.startsWith('/docs')) || (href.startsWith('/map') && pathname.startsWith('/map')) ? "text-accent font-semibold" : "text-muted-foreground"
          )}
        >
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
             <span className="font-bold font-headline text-lg hidden sm:inline-block">
                Nomaryth
            </span>
          </Link>
          <NavLinks className="hidden md:flex" />
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => setOpenCommandMenu(true)}>
             <Search className="h-4 w-4" />
             <span className="text-muted-foreground">{t('header.search_docs')}</span>
             <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
             </kbd>
           </Button>
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpenCommandMenu(true)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
            </Button>
            
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>No new notifications</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <LanguageSwitcher />
          <ThemeToggle />
          <UserNav />

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="p-4">
                  <Link href="/" className="mb-8 flex items-center gap-2">
                    <Logo />
                  </Link>
                  <div className="flex flex-col gap-y-4">
                    <NavLinks className="flex-col items-start gap-4" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
       <CommandMenu open={openCommandMenu} setOpen={setOpenCommandMenu} />
       <Progress value={scrollProgress} className="absolute bottom-0 h-0.5 w-full bg-transparent rounded-none [&>div]:bg-primary" />
    </header>
  );
}
