'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  Home,
  MessageCircle,
  Bell,
  Wallet,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi, clearAuthSession, userApi } from '@/lib/api';
import { Brand } from '@/components/brand';

const sidebarItems = [
  { label: 'Dashboard', href: '/user/dashboard', icon: Home },
  { label: 'Chat', href: '/user/chat', icon: MessageCircle, badgeKey: 'chat' },
  { label: 'Notifications', href: '/user/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Wallet', href: '/user/wallet', icon: Wallet },
  { label: 'Profile', href: '/user/profile', icon: User },
  { label: 'Settings', href: '/user/settings', icon: Settings },
  { label: 'Help & Support', href: '/user/help', icon: HelpCircle },
];

export function UserNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadCounts = () => {
      userApi.notificationCount()
        .then((data) => {
          if (active) setNotificationCount(Number(data.unread) || 0);
        })
        .catch(() => undefined);

      userApi.chats()
        .then((data) => {
          const unreadChats = (data.chats || []).filter((c: any) => c.unreadCount > 0 || c.hasUnread).length;
          if (active) setChatCount(unreadChats);
        })
        .catch(() => undefined);
    };

    loadCounts();
    const interval = window.setInterval(loadCounts, 5000);

    const handleUnreadChange = (event: Event) => {
      const unread = Number((event as CustomEvent<{ unread: number }>).detail?.unread);
      if (Number.isFinite(unread) && active) setNotificationCount(unread);
    };

    window.addEventListener('notifications:unread', handleUnreadChange);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('notifications:unread', handleUnreadChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still complete
    } finally {
      clearAuthSession();
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-[#070B18]/90 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between text-white w-full">
        <Link href="/user/dashboard" className="flex items-center gap-2">
          <Brand imageClassName="h-8 w-8" className="text-white font-bold" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-full transition text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#070B18] border-r border-white/5 flex flex-col justify-between z-30 transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } text-white`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Logo Header */}
          <div className="p-6 flex items-center justify-between">
            <Link href="/user/dashboard" className="transition-transform hover:scale-[1.02] duration-300">
              <Brand className="text-xl font-bold tracking-tight text-white" imageClassName="h-9 w-9" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1.5 px-4 flex-1 overflow-y-hidden">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/user/dashboard' && pathname.startsWith(item.href));
              
              let badgeVal = 0;
              if (item.badgeKey === 'chat') badgeVal = chatCount;
              if (item.badgeKey === 'notifications') badgeVal = notificationCount;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-[14px] transition-all duration-300 group text-sm font-semibold ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'} />
                  <span className="flex-grow">{item.label}</span>
                  
                  {/* Badge */}
                  {badgeVal > 0 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive ? 'bg-white text-[#EC4899]' : 'bg-[#EC4899] text-white'
                    }`}>
                      {badgeVal}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section (Upgrade card, Logout, Couple graphic) */}
        <div className="p-4 space-y-4 border-t border-white/5 bg-[#070B18]">
          
         

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition text-sm font-semibold"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* Sidebar Bottom Couple Illustration (glowing romantic backdrop) */}
         

        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
