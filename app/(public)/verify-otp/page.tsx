'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, TimerReset } from 'lucide-react';

const mockCode = '111111'; // For demo purposes only

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(90);
  const [mobile, setMobile] = useState('+91 98765 43210');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Enter the 6-digit code sent to your phone.');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('onboardPhone') : null;
    if (storedPhone) {
      setMobile(storedPhone);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((count) => Math.max(count - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    // Clear error when user starts typing again
    if (error) {
      setError('');
      setInfo('Enter the 6-digit code sent to your phone.');
    }

    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const focusIndex = Math.min(pasted.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();

    if (error) {
      setError('');
      setInfo('Enter the 6-digit code sent to your phone.');
    }
  };

  const clearOtpAndFocusFirst = () => {
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => {
      document.getElementById('otp-0')?.focus();
    }, 10);
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    const code = otp.join('');

    if (code.length < 6) {
      setError('Enter the full 6-digit code.');
      setInfo('');
      return;
    }

    if (code !== mockCode) {
      setError(`Invalid code. Use ${mockCode} for this demo.`);
      setInfo('');
      // Clear wrong OTP and focus first input
      clearOtpAndFocusFirst();
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push('/user/profile/age-verify');
  };

  const handleResend = () => {
    setTimeLeft(90);
    setInfo('A new code has been requested. Check your phone for 483219.');
    setError('');
    clearOtpAndFocusFirst();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.1),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_35%)] p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition">
            <ArrowLeft size={16} />
            Change number
          </Link>

          <div className="text-center mb-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-pink-600">
              <ShieldCheck size={14} />
              Secure SMS
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Mobile</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enter the code sent to <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mobile}</span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleVerify}>
            <div className="rounded-[1.75rem] border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-950/70">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Verification code</p>
              <div className="mt-5 flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    className="w-14 h-14 rounded-3xl border border-zinc-200 bg-white text-center text-2xl font-semibold text-zinc-950 transition focus:border-pink-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                ))}
              </div>
            </div>

            {error ? (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            ) : info ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{info}</p>
            ) : null}

            <div className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <TimerReset size={16} />
                Expires in
              </span>
              <span className="font-semibold text-pink-500">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0}
              className={`font-semibold transition ${
                timeLeft > 0
                  ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'text-pink-500 hover:text-pink-600'
              }`}
            >
              {timeLeft > 0 ? `Resend in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 'Resend code'}
            </button>
            <p className="text-xs">Mock code: <span className="font-semibold text-zinc-900 dark:text-white">{mockCode}</span></p>
          </div>
        </div>
      </Card>
    </div>
  );
}