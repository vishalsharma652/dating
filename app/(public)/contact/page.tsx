'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Clock, Send, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getApiBaseUrl } from '@/lib/api';

export default function ContactPage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace('/user/help');
    }
  }, [router]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) return;
    setSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/user/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight bg-gradient-to-r from-white via-pink-200 to-pink-500 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Have questions, feedback, or need help? We'd love to hear from you. Send us a message!
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-stretch">
          {/* Left Side Info Cards (5 Cols) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            {/* Email Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0 text-pink-400">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">Email Support</h3>
                  <a href="mailto:support@saathika.com" className="text-pink-400 hover:text-pink-300 text-sm font-semibold transition">
                    support@saathika.com
                  </a>
                  <p className="text-xs text-zinc-400 mt-1">Official support email for general inquiries.</p>
                </div>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">Support Hours</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">10:00 AM – 6:00 PM IST</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Monday to Sunday</p>
                </div>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">Fast Response</h3>
                  <p className="text-xs text-zinc-300 font-semibold">Under 24 Hours Reply Guarantee</p>
                  <p className="text-xs text-zinc-400 mt-1">All support messages are reviewed & answered by our admin team.</p>
                </div>
              </div>
            </div>

            {/* Privacy Protection Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">Privacy Protected</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your personal information is kept strictly confidential and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Contact Form (7 Cols) */}
          <div className="md:col-span-7 flex">
            <div className="w-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-center">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Message Sent Successfully!</h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    Thank you for contacting us. Our support team has received your message and will respond to your email shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-2">Send Us a Message</h2>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Name</label>
                    <Input
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Email</label>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subject</label>
                    <Input
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Message</label>
                    <textarea
                      placeholder="Write your message here..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20 text-sm transition resize-none text-white"
                    />
                  </div>

                  <Button className="w-full h-12 gap-2 mt-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold" type="submit" disabled={submitting}>
                    <Send size={18} />
                    {submitting ? 'Sending Message...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
