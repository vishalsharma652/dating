import { ReactNode } from 'react';
import { PublicNav } from '@/components/public-nav';
import { RateLimitToast } from '@/components/ui/rate-limit-toast';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      <main>{children}</main>
      <RateLimitToast />
    </>
  );
}
