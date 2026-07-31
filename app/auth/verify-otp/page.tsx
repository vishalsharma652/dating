'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCcw, ShieldCheck, TimerReset } from 'lucide-react';
import { authApi, setAuthSession } from '@/lib/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 180; // 3 minutes (180 seconds) timer



export default function OTPPage() {
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otp, setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [timeLeft, setTimeLeft] = useState(RESEND_COOLDOWN);

  const [verifying, setVerifying]         = useState(false);
  const [resending, setResending]         = useState(false);
  const [error, setError]                 = useState('');
  const [resendSuccess, setResendSuccess] = useState('');

  // Load email from localStorage (set during registration)
  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('onboardEmail') : null;
    const storedName  = typeof window !== 'undefined' ? localStorage.getItem('onboardName')  : null;
    if (storedEmail) setEmail(storedEmail);
    if (storedName)  setName(storedName);
  }, []);


  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── OTP helpers ────────────────────────────────────────────────
  const focusInput = (index: number) => setTimeout(() => inputRefs.current[index]?.focus(), 10);

  const clearOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    focusInput(0);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');
    setResendSuccess('');
    if (value && index < OTP_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) focusInput(index - 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  // ── Verify ─────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setVerifying(true);
    try {
      const data = await authApi.verifyOtp({ email, otp: code });
      setAuthSession(data.token, data.user);
      localStorage.removeItem('backendOtp');
      localStorage.removeItem('onboardEmail');
      localStorage.removeItem('onboardName');
      router.push('/user/profile/age-verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
      clearOtp();
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    setError('');
    setResendSuccess('');
    setResending(true);
    try {
      await authApi.resendOtp({ email });
      setResendSuccess('Verification code has been resent to your email.');
      setTimeLeft(RESEND_COOLDOWN);
      clearOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };


  const canResend = timeLeft === 0 && !resending;

  // Mask email for display: a****@example.com
  const maskedEmail = email
    ? email.replace(/^(.{1,2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 4)) + c)
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.07),_transparent_35%)]">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
          >
            <ArrowLeft size={16} />
            Back to Register
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-pink-600">
              <ShieldCheck size={14} />
              Email Verification
            </div>
            <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="text-pink-500" size={30} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Check your Email</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {name && <span>Hi <strong className="text-zinc-900 dark:text-zinc-100">{name}</strong>! </span>}
              We&apos;ve sent a 6-digit code to{' '}
              <span className="font-semibold text-pink-600 underline">{email || 'your email'}</span>
            </p>

          </div>

          <form className="space-y-6" onSubmit={handleVerify}>
            {/* OTP boxes */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={verifying}
                  className={`w-12 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition
                    ${error
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-600'
                      : 'border-zinc-200 dark:border-zinc-700 focus:border-pink-500 dark:bg-zinc-800'
                    }
                    disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Status messages */}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 font-medium flex items-center gap-2">
                <span className="shrink-0">⚠</span>
                {error}
              </p>
            )}
            {resendSuccess && !error && (
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                {resendSuccess}
              </p>
            )}

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5">
                <TimerReset size={15} />
                {timeLeft > 0
                  ? <>Code expires in <span className="font-semibold text-pink-500">{formatTime(timeLeft)}</span></>
                  : <span className="text-zinc-400">Code expired — please resend.</span>
                }
              </p>
            </div>

            {/* Verify button */}
            <Button className="w-full h-11" type="submit" disabled={verifying || resending}>
              {verifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </Button>
          </form>

          {/* Resend section */}
          <p className="text-center text-sm mt-6 text-zinc-600 dark:text-zinc-400">
            Didn&apos;t receive the email?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              aria-busy={resending}
              className={`inline-flex items-center gap-1 font-semibold transition
                ${canResend
                  ? 'text-pink-500 hover:text-pink-600 active:scale-95'
                  : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
            >
              {resending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Sending...
                </>
              ) : timeLeft > 0 ? (
                <>{formatTime(timeLeft)}</>
              ) : (
                <>
                  <RefreshCcw size={13} />
                  Resend
                </>
              )}
            </button>
          </p>

          <p className="text-center text-xs text-zinc-400 mt-4">
            Check your spam/junk folder if you don&apos;t see it in your inbox.
          </p>
        </div>
      </Card>
    </div>
  );
}
