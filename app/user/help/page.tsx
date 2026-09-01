'use client';

import { Container } from '@/components/ui/container';
import {
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Phone,
  Mail,
  HelpCircle,
  Send,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getStoredUser, getToken, getApiBaseUrl } from '@/lib/api';

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
    const minsLeft = (24 - h - 1) * 60 + (60 - m) + 10 * 60;
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    return `Opens in ${hrs}h ${mins}m (tomorrow at 10:00 AM IST)`;
  } else {
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

  // Support Form State
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Query',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [userTickets, setUserTickets] = useState<any[]>([]);

  const loadUserTickets = async () => {
    try {
      const token = getToken();
      const baseUrl = getApiBaseUrl();
      if (!token) return;
      const res = await fetch(`${baseUrl}/user/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserTickets(data.data.tickets || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const check = () => {
      const online = isWithinSupportHours();
      setSupportOnline(online);
      if (!online) setTimeMsg(getTimeUntilOpen());
    };
    check();
    loadUserTickets();
    const interval = setInterval(check, 60000);

    // Pre-fill logged-in user data
    const user = getStoredUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || user.username || prev.name,
        email: user.email || prev.email,
      }));
    }

    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setFormError('Please fill in both the subject and message fields.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const token = getToken();
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/user/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit support request');
      }

      setSubmitted(true);
      loadUserTickets();
      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: '',
      }));
    } catch (err: any) {
      setFormError(err.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <p className="text-zinc-400 text-sm mb-7">Search our FAQ or send a message to our support team</p>

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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition shadow-lg shadow-pink-600/20"
                >
                  <MessageSquare size={15} />
                  Send Us a Message
                </button>

                <a
                  href="mailto:support@saathika.com"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-sm transition"
                >
                  <Mail size={15} />
                  Email Us
                </a>
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

          {/* Quick Contact Card */}
          <div className="mb-10">
            <div className="rounded-2xl bg-white/3 border border-white/8 p-5 flex items-center gap-4 max-w-md">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Email Support</p>
                <p className="text-xs text-zinc-400">support@saathika.com</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Response within 24 hours</p>
              </div>
            </div>
          </div>

          {/* ── Contact Support Ticket Form Section ── */}
          <div ref={formRef} className="mb-12 rounded-3xl bg-white/[0.02] border border-white/10 p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
                <MessageSquare className="text-pink-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Send Us a Message</h2>
                <p className="text-xs text-zinc-400">Have a question or facing an issue? Fill out the form below and we'll reply to your email.</p>
              </div>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center animate-fade-in">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Message Sent Successfully!</h3>
                <p className="text-sm text-zinc-300 mb-4 max-w-md mx-auto">
                  Thank you for reaching out. Our support team has received your message and will respond to <span className="text-emerald-400 font-semibold">{formData.email || 'your email'}</span> as soon as possible.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#0d1326] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500/50 transition"
                    >
                      <option value="General Query">General Query</option>
                      <option value="Account & Profile">Account & Profile</option>
                      <option value="Payments & Coins">Payments & Coins</option>
                      <option value="Chat & Matching">Chat & Matching</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief subject of your query"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your issue or question in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-pink-600/25"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── My Support Tickets & Admin Replies ── */}
          {userTickets.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-black mb-4 text-white flex items-center gap-2">
                <MessageSquare className="text-pink-400" size={20} />
                My Support Requests & Admin Replies
              </h2>
              <div className="space-y-4">
                {userTickets.map((t: any) => (
                  <div key={t.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20">
                          #TKT-{t.id}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">{t.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1.5">{t.subject}</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/3 p-3 rounded-xl border border-white/5 mb-3">
                      {t.message}
                    </p>

                    {t.admin_reply ? (
                      <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                          <CheckCircle2 size={15} /> Admin Response
                        </div>
                        <p className="text-xs text-emerald-100 leading-relaxed">{t.admin_reply}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-400/80 italic">Waiting for admin reply...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Sections */}
          <h2 className="text-xl font-black mb-6 text-white">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((cat) => (
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
              ))
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Search size={36} className="mx-auto mb-3 opacity-40" />
                <p>
                  No results found for "<span className="text-white">{searchQuery}</span>"
                </p>
              </div>
            )}
          </div>

          {/* Bottom reassurance */}
          <div className="mt-10 rounded-2xl border border-white/6 bg-gradient-to-r from-pink-600/8 to-purple-600/8 p-6 text-center">
            <CheckCircle2 size={28} className="mx-auto mb-2.5 text-pink-400" />
            <p className="text-sm font-bold text-white mb-1">We're here for you</p>
            <p className="text-xs text-zinc-400">
              Every query is important. Our team is dedicated to making your Saathika experience the best it can be.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
