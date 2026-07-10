'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Home,
  Compass,
  Heart,
  MessageCircle,
  Bell,
  Wallet,
  User,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi, clearAuthSession } from '@/lib/api';

const sidebarItems = [
  { label: 'Dashboard', href: '/user/dashboard', icon: Home },
  { label: 'Discover', href: '/user/discover', icon: Compass },
  { label: 'Matches', href: '/user/matches', icon: Heart },
  { label: 'Chat', href: '/user/chat', icon: MessageCircle },
  { label: 'Notifications', href: '/user/notifications', icon: Bell },
  { label: 'Wallet', href: '/user/wallet', icon: Wallet },
  { label: 'Profile', href: '/user/profile', icon: User },
  { label: 'Settings', href: '/user/settings', icon: Settings },
  { label: 'Help', href: '/user/help', icon: HelpCircle },
];

export function UserNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still complete if the session is already expired.
    } finally {
      clearAuthSession();
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800 p-4 flex items-center justify-between">
        <Link href="/user/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
          <span className="font-bold">Ember</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <span className="block h-5 w-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800 z-30 transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
          <div className="hidden md:block">
            <div className="font-bold text-lg">Ember</div>
            <div className="text-xs text-zinc-500">Dating App</div>
          </div>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-600 dark:text-pink-400 font-semibold'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200/80 dark:border-zinc-800">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
