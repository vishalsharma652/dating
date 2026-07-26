import { ReactNode } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { Brand } from '@/components/brand';

export default function RootPublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="bg-[#070B18] min-h-screen text-white relative overflow-hidden">
        {/* Ambient Glowing Lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#EC4899]/8 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-slow" />
        <div className="absolute top-[40%] right-[-10%] w-[60%] h-[60%] bg-[#7C3AED]/8 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10">{children}</div>
      </main>

      <footer className="bg-[#070B18] border-t border-white/5 py-24 text-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-6 lg:col-span-1">
              <Link href="/" className="inline-block transition-transform hover:scale-[1.02] duration-300">
                <Brand showName={true} imageClassName="h-9 w-9" className="text-xl font-bold tracking-tight text-white" />
              </Link>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                Bringing hearts together and creating meaningful connections that last a lifetime.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {/* Facebook */}
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-[#EC4899] hover:border-[#EC4899]/30 hover:bg-[#EC4899]/5 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)] transition-all duration-300"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
                
                {/* Instagram */}
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-[#EC4899] hover:border-[#EC4899]/30 hover:bg-[#EC4899]/5 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)] transition-all duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>

                {/* Twitter */}
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-[#EC4899] hover:border-[#EC4899]/30 hover:bg-[#EC4899]/5 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)] transition-all duration-300"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Linkedin */}
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-white/5 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-[#EC4899] hover:border-[#EC4899]/30 hover:bg-[#EC4899]/5 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)] transition-all duration-300"
                  aria-label="Linkedin"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-5">
              <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-200">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Features</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Pricing</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Security</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Success Stories</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="space-y-5">
              <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-200">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">About</Link></li>
                <li><Link href="/contact" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Contact</Link></li>
                <li><Link href="/help" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Help</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Blog</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="space-y-5">
              <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-200">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/legal/terms" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Terms</Link></li>
                <li><Link href="/legal/privacy" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Privacy</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Refund Policy</Link></li>
                <li><Link href="/" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Cookies</Link></li>
              </ul>
            </div>

            {/* Column 5: Social Links */}
            <div className="space-y-5">
              <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-200">Social</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Twitter</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Instagram</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">Facebook</a></li>
                <li><a href="#" className="text-zinc-400 hover:text-[#EC4899] transition-colors duration-200 font-medium">YouTube</a></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500 font-medium">
              &copy; {new Date().getFullYear()} Saathika. All rights reserved.
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
              Made with <span className="text-[#EC4899] animate-pulse font-bold">❤️</span> for meaningful connections
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
