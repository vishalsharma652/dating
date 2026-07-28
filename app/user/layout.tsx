'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
import { RateLimitToast } from '@/components/ui/rate-limit-toast';
import { CallProvider } from '@/components/user/call-provider';
import { authApi } from '@/lib/api';

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isInsideChatRoom = pathname.startsWith('/user/chat/') && pathname !== '/user/chat';

  // ── Global real-time Activity Status heartbeat ─────────────────────
  useEffect(() => {
    const sendHeartbeat = () => {
      authApi.heartbeat().catch(() => undefined);
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 15000);

    const handleUnload = () => {
      authApi.logout().catch(() => undefined);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <CallProvider>
      <div className="flex">
        <UserNav />
        <main className={`flex-1 min-h-screen bg-[#070B18] text-white overflow-x-hidden ${isInsideChatRoom ? 'pb-0' : 'pb-20 md:pb-0'}`}>
          {children}
        </main>
        <RateLimitToast />
      </div>
    </CallProvider>
  );
}


