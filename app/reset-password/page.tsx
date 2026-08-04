'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/brand';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, ShieldAlert, Key } from 'lucide-react';
import { authApi } from '@/lib/api';
import Loading from '@/app/loading';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlToken = searchParams.get('token') || '';
  const urlEmail = searchParams.get('email') || '';

  const [otpOrToken, setOtpOrToken] = useState(urlToken);
  const [email, setEmail] = useState(urlEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlToken) setOtpOrToken(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, [urlToken, urlEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tokenVal = otpOrToken.trim();
    if (!tokenVal) {
      setError('Please enter your 6-digit OTP code or reset token.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token: tokenVal.length > 10 ? tokenVal : undefined,
        otp: tokenVal.length <= 10 ? tokenVal : undefined,
        email: email.trim().toLowerCase() || undefined,
        password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password. Token or OTP may be invalid.');
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
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>

          {success ? (
            <div className="text-center space-y-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">Password Reset Complete!</h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Button
                asChild
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-sm shadow-lg border-0 mt-4"
              >
                <Link href="/login">Sign In Now</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EC4899]/10 border border-[#EC4899]/20 text-[#EC4899]">
                  <KeyRound size={28} />
                </div>
                <Brand className="justify-center mb-2" imageClassName="h-9 w-9" />
                <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your 6-digit OTP code (or token) from your email and your new password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* OTP or Token input */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    6-Digit OTP Code / Reset Token
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="text"
                      placeholder="e.g. 849201"
                      value={otpOrToken}
                      onChange={(e) => setOtpOrToken(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-sm font-mono focus:border-[#EC4899]"
                    />
                  </div>
                </div>

                {/* Email address input (optional if OTP used) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Registered Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-sm focus:border-[#EC4899]"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-sm focus:border-[#EC4899]"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-11 text-sm focus:border-[#EC4899]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-sm shadow-lg border-0 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]"><Loading /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
