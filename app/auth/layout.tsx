import { ReactNode } from 'react';
import { PublicNav } from '@/components/public-nav';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      <main>{children}</main>
    </>
  );
}
