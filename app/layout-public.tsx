import { ReactNode } from 'react';
import { PublicNav } from '@/components/public-nav';

export default function PublicPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      <main>{children}</main>
      <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li><a href="/" className="hover:text-pink-500 transition">Features</a></li>
                <li><a href="/" className="hover:text-pink-500 transition">Pricing</a></li>
                <li><a href="/" className="hover:text-pink-500 transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li><a href="/about" className="hover:text-pink-500 transition">About</a></li>
                <li><a href="/contact" className="hover:text-pink-500 transition">Contact</a></li>
                <li><a href="/help" className="hover:text-pink-500 transition">Help</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li><a href="/terms" className="hover:text-pink-500 transition">Terms</a></li>
                <li><a href="/privacy" className="hover:text-pink-500 transition">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Social</h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li><a href="#" className="hover:text-pink-500 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-pink-500 transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200/80 dark:border-zinc-800 pt-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              © 2024 Ember. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
