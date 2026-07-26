'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';

export function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#070B18]/70 backdrop-blur-xl border-b border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02] duration-300">
            <Brand imageClassName="h-9 w-9" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-[#EC4899] transition-colors duration-300">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-zinc-300 hover:text-[#EC4899] transition-colors duration-300">
              About
            </Link>
            <Link href="/help" className="text-sm font-medium text-zinc-300 hover:text-[#EC4899] transition-colors duration-300">
              Help
            </Link>
            <Link href="/contact" className="text-sm font-medium text-zinc-300 hover:text-[#EC4899] transition-colors duration-300">
              Contact
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/5 px-4 font-medium" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#7C3AED] hover:opacity-95 text-white rounded-full border-0 px-6 h-10 transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.45)] hover:scale-[1.02]" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-full transition text-zinc-300 hover:text-white"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-2 bg-[#070B18]/95 backdrop-blur-xl">
            <Link href="/" className="block px-4 py-2 text-zinc-300 hover:text-[#EC4899] hover:bg-white/5 rounded transition-colors duration-200">
              Home
            </Link>
            <Link href="/about" className="block px-4 py-2 text-zinc-300 hover:text-[#EC4899] hover:bg-white/5 rounded transition-colors duration-200">
              About
            </Link>
            <Link href="/help" className="block px-4 py-2 text-zinc-300 hover:text-[#EC4899] hover:bg-white/5 rounded transition-colors duration-200">
              Help
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-zinc-300 hover:text-[#EC4899] hover:bg-white/5 rounded transition-colors duration-200">
              Contact
            </Link>
            <div className="px-4 py-2 flex gap-2">
              <Button variant="ghost" size="sm" asChild className="flex-1 text-zinc-300 hover:text-white hover:bg-white/5">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="flex-1 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white border-0">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
