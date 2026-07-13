import { ReactNode } from 'react';
import { UserNav } from '@/components/user-nav';
import { RateLimitToast } from '@/components/ui/rate-limit-toast';
import { CallProvider } from '@/components/user/call-provider';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <CallProvider>
      <div className="flex">
        <UserNav />
        <main className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-900">{children}</main>
        <RateLimitToast />
      </div>
    </CallProvider>
  );
}
