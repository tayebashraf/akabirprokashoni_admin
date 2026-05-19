'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, BookOpen, Users, Tag,
  Star, ImageIcon, Settings, LogOut, ChevronLeft,
  PenLine, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUIStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  group: string;
}

const navItems: NavItem[] = [
  { label: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard, group: 'প্রধান' },
  { label: 'অর্ডারসমূহ', href: '/orders', icon: Package, group: 'প্রধান' },
  { label: 'বইসমূহ', href: '/books', icon: BookOpen, group: 'প্রধান' },
  { label: 'লেখকগণ', href: '/authors', icon: PenLine, group: 'প্রধান' },
  { label: 'বিষয়সমূহ', href: '/categories', icon: Tag, group: 'প্রধান' },
  { label: 'রিভিউ', href: '/reviews', icon: Star, group: 'মডারেশন' },
  { label: 'হিরো স্লাইড', href: '/hero-slides', icon: ImageIcon, group: 'কনটেন্ট' },
  { label: 'সাইট সেটিংস', href: '/settings', icon: Settings, group: 'কনটেন্ট' },
  { label: 'গ্রাহকগণ', href: '/customers', icon: Users, group: 'ইউজার' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleCollapse, sidebarOpen, setSidebarOpen } = useUIStore();
  const logout = useAuthStore((s) => s.logout);

  const groups = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ব্র্যান্ড হেডার */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-white"
              style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
            >
              আকাবির
            </motion.span>
          )}
        </Link>
        {/* ডেস্কটপে collapse বাটন */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="hidden lg:flex text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </Button>
        {/* মোবাইলে close বাটন */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/50 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ন্যাভিগেশন */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                   style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  {groupName}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-emerald-400')} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0 text-xs px-1.5">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* লগআউট */}
      <div className="p-3 border-t border-zinc-800/50">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3'
          )}
          style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && 'লগআউট'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* মোবাইল ওভারলে */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-zinc-950 border-r border-zinc-800/50 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ডেস্কটপ সাইডবার */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-zinc-950 border-r border-zinc-800/50 transition-all duration-300 shrink-0',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
