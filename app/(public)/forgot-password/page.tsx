'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/brand';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, Send, ShieldAlert } from 'lucide-react';
import { authApi } from '@/lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Stage = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [stage, setStage]       = useState<Stage>('form');
  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Validation ─────────────────────────────────────────────
  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email address is required.';
    if (!emailPattern.test(value.trim())) return 'Enter a valid email address.';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (apiError)   setApiError('');
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }

    setLoading(true);
    setApiError('');
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setStage('sent');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend (retry from success screen) ────────────────────
  const handleResend = () => {
    setStage('form');
    setApiError('');
    setEmailError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.09),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.11),_transparent_32%)] p-4">
      <Card className="w-full max-w-md overflow-hidden">

        {/* ── Top accent bar ─────────────────────────────── */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500" />

        <div className="p-8">

          {/* ── Back link ──────────────────────────────────── */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition group"
          >
            <ArrowLeft size={15} className="transition group-hover:-translate-x-0.5" />
            Back to login
          </Link>

          {/* ══════════════════════════════════════════════════
              STAGE: FORM
          ══════════════════════════════════════════════════ */}
          {stage === 'form' && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 ring-1 ring-pink-500/20">
                  <KeyRound className="text-pink-500" size={30} />
                </div>
                <Brand className="justify-center mb-3" imageClassName="h-10 w-10" />
                <h1 className="text-2xl font-bold tracking-tight mb-2">Forgot your password?</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No worries! Enter your registered email address and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-4 top-3 transition ${
                        emailError ? 'text-red-400' : 'text-zinc-400'
                      }`}
                      size={20}
                    />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      className={`pl-12 ${emailError ? 'border-red-400 focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={() => setEmailError(validateEmail(email))}
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'email-error' : undefined}
                    />
                  </div>
                  {emailError && (
                    <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                      <ShieldAlert size={13} className="shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* API error */}
                {apiError && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 px-3.5 py-3 text-sm text-red-500">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-pink-500 hover:text-pink-600 transition">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ══════════════════════════════════════════════════
              STAGE: SUCCESS
          ══════════════════════════════════════════════════ */}
          {stage === 'sent' && (
            <div className="text-center">
              {/* Success icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                <CheckCircle2 className="text-green-500" size={38} strokeWidth={1.75} />
              </div>

              <h1 className="text-2xl font-bold mb-3">Check your inbox</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
                We&apos;ve sent password reset instructions to:
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6 break-all">
                {email}
              </p>

              {/* Info card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/60 text-left mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">What&apos;s next?</p>
                {[
                  'Open the reset email from Saathika.',
                  'Click the "Reset Password" link inside.',
                  'Create a new secure password.',
                  'Sign in with your new password.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-[10px] font-bold text-pink-500">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Didn&apos;t receive the email? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-pink-500 hover:text-pink-600 transition"
                >
                  try a different email address
                </button>
                .
              </p>

              <Button asChild className="w-full h-12">
                <Link href="/login">
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
