'use client';

import { Menu, Search, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore, useUIStore } from '@/lib/stores';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar, setCommandPaletteOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      {/* বাম দিক */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* সার্চ বাটন */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-500 text-sm hover:border-zinc-700 hover:text-zinc-400 transition-colors min-w-[240px]"
          style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">সার্চ করুন...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-500 border border-zinc-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ডান দিক */}
      <div className="flex items-center gap-2">
        {/* থিম টগল */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* নোটিফিকেশন */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* ইউজার মেনু */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                {user?.name || 'অ্যাডমিন'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
              প্রোফাইল
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-400 focus:text-red-400"
              style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
            >
              লগআউট
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
