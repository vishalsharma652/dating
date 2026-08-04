'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/brand';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, Send, ShieldAlert, Key, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import Loading from '@/app/loading';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Stage = 'email' | 'otp';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlEmail = searchParams.get('email') || '';

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState(urlEmail);
  const [emailError, setEmailError] = useState('');

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [urlEmail]);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email address is required.';
    if (!emailPattern.test(value.trim())) return 'Enter a valid email address.';
    return '';
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setStage('otp');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setOtpError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    setApiError('');
    setOtpError('');
    try {
      const res = await authApi.verifyResetOtp(email.trim().toLowerCase(), otp.trim());
      // Navigate to Set New Password screen with verified resetToken
      router.push(`/reset-password?token=${encodeURIComponent(res.resetToken)}&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.09),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.11),_transparent_32%)] p-4">
      <Card className="w-full max-w-md overflow-hidden bg-[#101827]/90 backdrop-blur-2xl border border-white/10 text-white shadow-2xl">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#7C3AED]" />

        <div className="p-8">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>

          {/* STAGE 1: EMAIL (Forgot Your Password?) */}
          {stage === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EC4899]/10 border border-[#EC4899]/20 text-[#EC4899]">
                  <KeyRound size={28} />
                </div>
                <Brand className="justify-center mb-2" imageClassName="h-9 w-9" />
                <h1 className="text-2xl font-black text-white tracking-tight">Forgot Your Password?</h1>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enter your registered email address and we&apos;ll send you a 6-digit OTP to reset your password.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendOtp} noValidate>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Registered Email Address</span>
                    {urlEmail && <span className="text-[10px] text-[#EC4899] font-normal">Pre-filled (Read-only)</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      readOnly={Boolean(urlEmail)}
                      className={`pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-sm focus:border-[#EC4899] ${
                        urlEmail ? 'cursor-not-allowed opacity-75 bg-white/[0.02]' : ''
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <ShieldAlert size={13} />
                      {emailError}
                    </p>
                  )}
                </div>

                {apiError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-sm shadow-lg border-0 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* STAGE 2: OTP VERIFICATION */}
          {stage === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Key size={28} />
                </div>
                <Brand className="justify-center mb-2" imageClassName="h-9 w-9" />
                <h1 className="text-2xl font-black text-white tracking-tight">OTP Verification</h1>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  We&apos;ve sent a 6-digit OTP code to <strong className="text-white">{email}</strong>.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="text"
                      placeholder="e.g. 849201"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        if (otpError) setOtpError('');
                      }}
                      autoFocus
                      maxLength={6}
                      className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-base font-mono tracking-widest text-center focus:border-[#EC4899]"
                    />
                  </div>
                  {otpError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <ShieldAlert size={13} />
                      {otpError}
                    </p>
                  )}
                </div>

                {apiError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-sm shadow-lg border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying OTP...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStage('email');
                      setApiError('');
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline transition"
                  >
                    Change Email Address
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]"><Loading /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
