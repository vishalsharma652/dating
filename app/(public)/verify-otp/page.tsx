'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCcw, ShieldCheck, TimerReset } from 'lucide-react';
import { authApi, setAuthSession } from '@/lib/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 90; // seconds

export default function VerifyOTPPage() {
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otp, setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [mobile, setMobile]     = useState('+91 98765 43210');
  const [timeLeft, setTimeLeft] = useState(RESEND_COOLDOWN);

  const [verifying, setVerifying]   = useState(false);
  const [resending, setResending]   = useState(false);
  const [error, setError]           = useState('');
  const [info, setInfo]             = useState('Enter the 6-digit code sent to your phone.');
  const [resendSuccess, setResendSuccess] = useState('');

  // Load phone from storage
  useEffect(() => {
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('onboardPhone') : null;
    if (storedPhone) setMobile(storedPhone);
    const backendOtp = typeof window !== 'undefined' ? localStorage.getItem('backendOtp') : null;
    if (backendOtp) setInfo(`Enter the 6-digit code sent to your phone. (Dev OTP: ${backendOtp})`);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  // ── OTP input helpers ──────────────────────────────────────
  const focusInput = (index: number) => {
    setTimeout(() => inputRefs.current[index]?.focus(), 10);
  };

  const clearOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(''));
    focusInput(0);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (error) { setError(''); }
    if (resendSuccess) setResendSuccess('');
    if (value && index < OTP_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      focusInput(index - 1);
    }
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

  // ── Verify ─────────────────────────────────────────────────
  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setResendSuccess('');
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setVerifying(true);
    try {
      const data = await authApi.verifyOtp({ phone: mobile.replace(/\D/g, ''), otp: code });
      setAuthSession(data.token, data.user);
      localStorage.removeItem('backendOtp');
      router.push('/user/profile/age-verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
      clearOtp();
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend ─────────────────────────────────────────────────
  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    setError('');
    setInfo('');
    setResendSuccess('');
    setResending(true);
    try {
      const data = await authApi.resendOtp({ phone: mobile.replace(/\D/g, '') });
      // Store dev OTP hint if returned
      if (data.otp) {
        localStorage.setItem('backendOtp', data.otp);
        setResendSuccess(`Verification code resent successfully. (Dev OTP: ${data.otp})`);
      } else {
        setResendSuccess('Verification code has been resent to your phone.');
      }
      // Restart countdown
      setTimeLeft(RESEND_COOLDOWN);
      clearOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const canResend = timeLeft === 0 && !resending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.1),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_35%)] p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
          >
            <ArrowLeft size={16} />
            Change number
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-pink-600">
              <ShieldCheck size={14} />
              Secure SMS
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Mobile</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enter the code sent to{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mobile}</span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleVerify}>
            {/* OTP boxes */}
            <div className="rounded-[1.75rem] border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-950/70">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Verification code</p>
              <div className="mt-5 flex justify-center gap-2">
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
                    className={`w-14 h-14 rounded-3xl border text-center text-2xl font-semibold transition focus:outline-none
                      ${error
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-600'
                        : 'border-zinc-200 bg-white text-zinc-950 focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                      }
                      disabled:opacity-50`}
                  />
                ))}
              </div>
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
            {!error && !resendSuccess && info && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{info}</p>
            )}

            {/* Timer strip */}
            <div className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <TimerReset size={16} />
                {timeLeft > 0 ? 'Expires in' : 'Code expired'}
              </span>
              {timeLeft > 0 ? (
                <span className="font-semibold text-pink-500">{formatTime(timeLeft)}</span>
              ) : (
                <span className="font-semibold text-zinc-400">—</span>
              )}
            </div>

            {/* Verify button */}
            <Button type="submit" className="w-full h-12" disabled={verifying || resending}>
              {verifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>

          {/* Resend row */}
          <div className="mt-6 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              aria-busy={resending}
              className={`inline-flex items-center gap-1.5 font-semibold transition
                ${canResend
                  ? 'text-pink-500 hover:text-pink-600 active:scale-95'
                  : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
            >
              {resending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : timeLeft > 0 ? (
                <>
                  <TimerReset size={14} />
                  Resend in {formatTime(timeLeft)}
                </>
              ) : (
                <>
                  <RefreshCcw size={14} />
                  Resend code
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
