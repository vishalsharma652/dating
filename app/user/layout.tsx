import { ReactNode } from 'react';
import { UserNav } from '@/components/user-nav';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <UserNav />
      <main className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-900">{children}</main>
    </div>
  );
}
