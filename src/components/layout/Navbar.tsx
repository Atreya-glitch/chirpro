
"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bird, User, LogOut, Globe, Key, CreditCard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getStore, updateStore, UserState } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    const load = () => setUser(getStore());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const handleLogout = () => {
    updateStore({ isLoggedIn: false });
    router.push('/login');
  };

  const languages = ["English", "Spanish", "Hindi", "Portuguese", "Chinese", "French"];

  const handleLangSelect = (lang: string) => {
    if (user?.language === lang) return;
    router.push(`/verify-lang?lang=${lang}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border px-4 py-3 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
        <Bird className="w-8 h-8" />
        <span className="font-headline tracking-tight">ChirpPro</span>
      </Link>

      <div className="flex items-center gap-3">
        {user?.isLoggedIn ? (
          <>
            <Link href="/subscription">
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 bg-primary/5 hover:bg-primary/10 rounded-full">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="font-semibold">{user.subscription}</span>
              </Button>
            </Link>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/forgot-password">
                    <Button variant="ghost" size="icon" className="rounded-full text-accent hover:bg-accent/10">
                      <Key className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Security & Reset</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full px-3 hover:bg-secondary">
                  <Globe className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold hidden sm:inline">{user.language}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl ring-1 ring-border p-2">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 pb-2">Select Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map(lang => (
                  <DropdownMenuItem 
                    key={lang} 
                    onClick={() => handleLangSelect(lang)}
                    className={`rounded-lg cursor-pointer transition-colors ${user.language === lang ? 'bg-accent/10 text-accent font-bold' : ''}`}
                  >
                    {lang}
                    {user.language === lang && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/forgot-password">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-transparent">Reset Access</Button>
            </Link>
            <Link href="/login">
              <Button variant="default" className="btn-hover bg-primary rounded-full px-6">Login</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
