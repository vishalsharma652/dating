import { ReactNode } from 'react';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="bg-[#070B18] min-h-screen text-white relative overflow-hidden">
        {/* Ambient Glowing Lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#EC4899]/8 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-slow" />
        <div className="absolute top-[40%] right-[-10%] w-[60%] h-[60%] bg-[#7C3AED]/8 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">{children}</div>
      </main>
      <PublicFooter />
    </>
  );
}
