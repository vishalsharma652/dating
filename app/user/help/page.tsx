'use client';

import { Container } from '@/components/ui/container';
import { Search, MessageCircle, Clock, CheckCircle2, ChevronDown, Phone, Mail, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function isWithinSupportHours(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST = UTC+5:30
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + istOffset * 60000);
  const h = ist.getHours();
  return h >= 10 && h < 18; // 10:00 AM to 6:00 PM IST
}

function getTimeUntilOpen(): string {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + istOffset * 60000);
  const h = ist.getHours();
  const m = ist.getMinutes();

  if (h >= 18) {
    // Opens next day at 10 AM
    const minsLeft = (24 - h - 1) * 60 + (60 - m) + 10 * 60;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    return `Opens in ${hrs}h ${mins}m (tomorrow at 10:00 AM IST)`;
  } else {
    // Before 10 AM
    const minsLeft = (10 - h - 1) * 60 + (60 - m);
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    return `Opens in ${hrs}h ${mins}m (at 10:00 AM IST today)`;
  }
}

const faqs = [
  {
    category: 'Getting Started',
    icon: '🚀',
    items: [
      { q: 'How do I create an account?', a: 'Visit the Register page, fill in your details, and verify your phone number. You can then set up your profile with photos and bio.' },
      { q: 'How do I verify my profile?', a: 'Complete your KYC verification by uploading government-issued ID, and verify your age and mobile number.' },
    ],
  },
  {
    category: 'Account & Security',
    icon: '🔐',
    items: [
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.' },
      { q: 'Is my data safe?', a: 'Yes, we use industry-standard encryption to protect your personal data. Check our Privacy Policy for more details.' },
    ],
  },
  {
    category: 'Coins & Payments',
    icon: '🪙',
    items: [
      { q: 'What are coins used for?', a: 'Coins help boost your profile visibility, send super likes, unlock premium features, and send virtual gifts.' },
      { q: 'Can I get a refund on coins?', a: 'All coin purchases are non-refundable, but coins never expire.' },
    ],
  },
  {
    category: 'Matching & Chat',
    icon: '💬',
    items: [
      { q: 'How does matching work?', a: 'We use an advanced algorithm considering your interests, location, and preferences to suggest compatible profiles.' },
      { q: 'How do I unmatch someone?', a: 'Open the chat, tap the menu, and select "Unmatch". This action cannot be undone.' },
    ],
  },
  {
    category: 'Safety & Community',
    icon: '🛡️',
    items: [
      { q: 'How do I report a user?', a: 'Go to their profile, tap "More", and select "Report". Our team will review the report.' },
      { q: 'What happens if I receive inappropriate messages?', a: 'Block the user immediately and report the conversation to our support team. We take such matters seriously.' },
    ],
  },
  {
    category: 'Account Deletion',
    icon: '🗑️',
    items: [
      { q: 'How do I delete my account?', a: 'Go to Settings > Account > Delete Account. Your profile and data will be permanently removed.' },
      { q: 'Can I reactivate my deleted account?', a: 'No, account deletion is permanent. You can create a new account anytime.' },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [supportOnline, setSupportOnline] = useState(false);
  const [timeMsg, setTimeMsg] = useState('');

  useEffect(() => {
    const check = () => {
      const online = isWithinSupportHours();
      setSupportOnline(online);
      if (!online) setTimeMsg(getTimeUntilOpen());
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#070B18] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#0d1628] to-[#070B18] border-b border-white/5 px-4 py-14 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-pink-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-pink-400 mb-4">
            <HelpCircle size={13} /> Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">How can we help you?</h1>
          <p className="text-zinc-400 text-sm mb-7">Search our FAQ or contact our support team</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:bg-white/8 transition"
            />
          </div>
        </div>
      </div>

      <Container>
        <div className="py-10">

          {/* ── Still Need Help — Time-based Support Section ── */}
          <div className={`mb-10 rounded-2xl border overflow-hidden ${
            supportOnline
              ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-600/10 via-teal-900/10 to-transparent'
              : 'border-zinc-700/40 bg-gradient-to-br from-zinc-800/30 via-zinc-900/20 to-transparent'
          }`}>
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Status Icon */}
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${
                supportOnline ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-zinc-800/50 border border-zinc-700/40'
              }`}>
                {supportOnline ? (
                  <MessageCircle size={28} className="text-emerald-400" />
                ) : (
                  <Clock size={28} className="text-zinc-500" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-black text-white">Still Need Help?</h2>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    supportOnline
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-700/30 border-zinc-600/30 text-zinc-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${supportOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    {supportOnline ? 'Online Now' : 'Offline'}
                  </span>
                </div>

                {supportOnline ? (
                  <p className="text-zinc-300 text-sm">
                    Our support team is <span className="text-emerald-400 font-bold">live right now</span>. We typically respond within 5–10 minutes.
                  </p>
                ) : (
                  <p className="text-zinc-400 text-sm">
                    Support is available <span className="text-white font-bold">10:00 AM – 6:00 PM IST</span>, Mon–Sun.{' '}
                    <span className="text-amber-400 font-semibold">{timeMsg}</span>
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                  <Clock size={12} /> Working Hours: 10:00 AM – 6:00 PM IST (Mon – Sun)
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
                {supportOnline ? (
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition"
                  >
                    <MessageCircle size={15} />
                    Chat with Us
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-700/50 text-zinc-500 font-bold text-sm cursor-not-allowed border border-zinc-600/30"
                  >
                    <MessageCircle size={15} />
                    Chat Offline
                  </button>
                )}
                <Link
                  href="mailto:support@saathika.com"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-sm transition"
                >
                  <Mail size={15} />
                  Email Us
                </Link>
              </div>
            </div>

            {/* Support Hours Bar */}
            <div className="px-6 sm:px-8 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  {(() => {
                    const now = new Date();
                    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
                    const totalMins = ist.getHours() * 60 + ist.getMinutes();
                    const startMins = 10 * 60;
                    const endMins = 18 * 60;
                    const progress = Math.min(Math.max((totalMins - startMins) / (endMins - startMins), 0), 1);
                    return (
                      <div
                        className={`h-full rounded-full transition-all ${supportOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    );
                  })()}
                </div>
                <span className="text-[10px] text-zinc-500 whitespace-nowrap">10 AM ——— 6 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="rounded-2xl bg-white/3 border border-white/8 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Email Support</p>
                <p className="text-xs text-zinc-400">support@saathika.com</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Response within 24 hours</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/3 border border-white/8 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <Phone size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Phone Support</p>
                <p className="text-xs text-zinc-400">+91 98765 43210</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Mon–Sun, 10 AM – 6 PM IST</p>
              </div>
            </div>
          </div>

          {/* FAQ Sections */}
          <h2 className="text-xl font-black mb-6 text-white">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {filteredFaqs.length > 0 ? filteredFaqs.map((cat) => (
              <div key={cat.category} className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/6 flex items-center gap-2.5 bg-white/3">
                  <span className="text-lg">{cat.icon}</span>
                  <h3 className="font-black text-sm text-zinc-200 uppercase tracking-wider">{cat.category}</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {cat.items.map((item, idx) => {
                    const key = `${cat.category}-${idx}`;
                    const isOpen = openItem === key;
                    return (
                      <button
                        key={idx}
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="w-full text-left px-5 py-4 transition hover:bg-white/3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm font-semibold text-zinc-200 leading-relaxed">{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={`flex-shrink-0 mt-0.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                        {isOpen && (
                          <p className="mt-3 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                            {item.a}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-zinc-500">
                <Search size={36} className="mx-auto mb-3 opacity-40" />
                <p>No results found for "<span className="text-white">{searchQuery}</span>"</p>
              </div>
            )}
          </div>

          {/* Bottom reassurance */}
          <div className="mt-10 rounded-2xl border border-white/6 bg-gradient-to-r from-pink-600/8 to-purple-600/8 p-6 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2.5 text-pink-400" />
            <p className="text-sm font-bold text-white mb-1">We're here for you</p>
            <p className="text-xs text-zinc-400">Every query is important. Our team is dedicated to making your Saathika experience the best it can be.</p>
          </div>

        </div>
      </Container>
    </div>
  );
}
