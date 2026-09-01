import Link from 'next/link';
import { Brand } from '@/components/brand';

export function PublicFooter() {
  return (
    <footer className="bg-[#070B18] border-t border-white/10 py-16 text-white relative z-20 overflow-hidden">
      {/* Subtle Footer Ambient Light */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-gradient-to-t from-[#EC4899]/10 via-[#7C3AED]/5 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="inline-block transition-transform hover:scale-[1.02] duration-300">
              <Brand showName={true} imageClassName="h-9 w-9" className="text-xl font-bold tracking-tight text-white" />
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Bringing hearts together and creating meaningful connections that last a lifetime.
            </p>
            <div className="pt-1">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                100% Safe & Verified Platform
              </div>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-300">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/help" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>Help Center</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Safety */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-widest text-zinc-300">Legal & Safety</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal/terms" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/help" className="group flex items-center text-zinc-400 hover:text-white transition-colors duration-200 font-medium">
                  <span className="text-[#EC4899] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mr-1 text-xs">→</span>
                  <span>Safety Guidelines</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Join Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-md space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-sm text-white">Find Your Match</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Start meeting genuine singles near you today.
              </p>
            </div>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white text-xs font-semibold shadow-lg shadow-[#EC4899]/20 hover:shadow-[#EC4899]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Create Free Account</span>
              <span>→</span>
            </Link>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-400 font-medium">
            &copy; {new Date().getFullYear()} Saathika. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
            Made with <span className="text-[#EC4899] animate-pulse font-bold mx-0.5">❤️</span> for meaningful connections
          </p>
        </div>
      </div>
    </footer>
  );
}
