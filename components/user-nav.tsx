'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  MessageCircle,
  Bell,
  Wallet,
  User,
  Search,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Gem,
  Coins,
} from 'lucide-react';
import { authApi, clearAuthSession, getStoredUser, userApi } from '@/lib/api';
import { Brand } from '@/components/brand';

const sidebarItems = [
  { label: 'Dashboard', href: '/user/dashboard', icon: Home },
  { label: 'Search ID', href: '/user/search', icon: Search },
  { label: 'Chat', href: '/user/chat', icon: MessageCircle, badgeKey: 'chat' },
  { label: 'Notifications', href: '/user/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Wallet', href: '/user/wallet', icon: Wallet },
  { label: 'Profile', href: '/user/profile', icon: User },
  { label: 'Settings', href: '/user/settings', icon: Settings },
  { label: 'Help & Support', href: '/user/help', icon: HelpCircle },
];

// Bottom nav items for mobile (most important 4 + menu)
const bottomNavItems = [
  { label: 'Home', href: '/user/dashboard', icon: Home },
  { label: 'Chat', href: '/user/chat', icon: MessageCircle, badgeKey: 'chat' },
  { label: 'Alerts', href: '/user/notifications', icon: Bell, badgeKey: 'notifications' },
  { label: 'Profile', href: '/user/profile', icon: User },
];

export function UserNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const initialUser = getStoredUser();
    if (initialUser) setCurrentUser(initialUser);

    userApi.profile()
      .then((data) => {
        if (active && data?.user) {
          setCurrentUser(data.user);
          if (typeof window !== 'undefined') {
            const currentStored = getStoredUser() || {};
            localStorage.setItem('ember_user', JSON.stringify({ ...currentStored, ...data.user }));
          }
        }
      })
      .catch(() => undefined);

    const handleProfileUpdate = (event: Event) => {
      const updated = (event as CustomEvent)?.detail || getStoredUser();
      if (updated && active) {
        setCurrentUser(updated);
      }
    };

    window.addEventListener('user:profile-updated', handleProfileUpdate);
    return () => {
      active = false;
      window.removeEventListener('user:profile-updated', handleProfileUpdate);
    };
  }, []);

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

  const isInsideChatRoom = pathname.startsWith('/user/chat/') && pathname !== '/user/chat';

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 bg-[#070B18] border-r border-white/5 flex-col justify-between z-30 text-white">
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
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] transition-all duration-300 group text-sm font-semibold ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-[0_8px_20px_rgba(236,72,153,0.25)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'} />
                  <span className="flex-grow">{item.label}</span>
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

        {/* Bottom Section */}
        <div className="p-4 space-y-3 border-t border-white/5 bg-[#070B18]">
          {/* Logged in User Card */}
          {currentUser && (() => {
            const isFemaleUser = ['female', 'woman', 'girl', 'women'].includes(String(currentUser.gender || '').toLowerCase());
            const IconSymbol = isFemaleUser ? Gem : Coins;
            const symbolColor = isFemaleUser ? 'text-cyan-400' : 'text-amber-400';
            const displayId = currentUser.unique_id || currentUser.uniqueId || (currentUser.id ? `STK-${String(currentUser.id).padStart(6, '0')}` : '');
            return (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate flex items-center gap-1.5">
                    <span>{currentUser.name || 'User'}</span>
                    <IconSymbol size={14} className={`${symbolColor} flex-shrink-0`} />
                  </p>
                  {displayId && (
                    <p className="text-[10px] font-mono text-emerald-400 font-bold truncate">ID {displayId}</p>
                  )}
                </div>
              </div>
            );
          })()}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition text-sm font-semibold"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAV BAR ===== */}
      {!isInsideChatRoom && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070B18]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2">

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/user/dashboard' && pathname.startsWith(item.href));
          let badgeVal = 0;
          if (item.badgeKey === 'chat') badgeVal = chatCount;
          if (item.badgeKey === 'notifications') badgeVal = notificationCount;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] shadow-[0_4px_12px_rgba(236,72,153,0.4)]' : ''}`}>
                <Icon size={20} className={isActive ? 'text-white' : 'text-zinc-400'} />
                {badgeVal > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EC4899] text-white text-[9px] font-black flex items-center justify-center">
                    {badgeVal > 9 ? '9+' : badgeVal}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-[#EC4899]' : 'text-zinc-500'}`}>{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1"
        >
          <div className="p-2 rounded-2xl">
            <Menu size={20} className="text-zinc-400" />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500">More</span>
        </button>
      </nav>
      )}


      {/* ===== MOBILE MORE MENU (Slide-up Sheet) ===== */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-up Panel */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1120] border-t border-white/10 rounded-t-3xl p-6 space-y-2">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <div className="flex items-center gap-3 mb-6">
              <Brand imageClassName="h-8 w-8" className="text-white font-bold" />
            </div>

            {[
              { label: 'Search ID', href: '/user/search', icon: Search },
              { label: 'Wallet', href: '/user/wallet', icon: Wallet },
              { label: 'Settings', href: '/user/settings', icon: Settings },
              { label: 'Help & Support', href: '/user/help', icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                    isActive ? 'bg-gradient-to-r from-[#EC4899]/20 to-[#7C3AED]/20 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
              >
                <LogOut size={20} />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
