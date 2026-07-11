'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';

export function PublicNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Brand imageClassName="h-8 w-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-pink-500 transition">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-pink-500 transition">
              About
            </Link>
            <Link href="/help" className="text-sm font-medium hover:text-pink-500 transition">
              Help
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-pink-500 transition">
              Contact
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
              aria-label={mounted ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : 'Switch theme'}
            >
              {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <span className="block h-5 w-5" />}
            </button>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <Link href="/" className="block px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              Home
            </Link>
            <Link href="/about" className="block px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              About
            </Link>
            <Link href="/help" className="block px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              Help
            </Link>
            <Link href="/contact" className="block px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              Contact
            </Link>
            <div className="px-4 py-2 flex gap-2">
              <Button variant="ghost" size="sm" asChild className="flex-1">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="flex-1">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
