'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(120);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Verify Your Number</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              We've sent a code to your phone number
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* OTP Input */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-zinc-200 dark:border-zinc-700 rounded-lg focus:border-pink-500 focus:outline-none dark:bg-zinc-800 transition"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Code expires in{' '}
                <span className="font-semibold text-pink-500">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* Verify Button */}
            <Button className="w-full h-11">Verify OTP</Button>
          </form>

          {/* Resend */}
          <p className="text-center text-sm mt-6 text-zinc-600 dark:text-zinc-400">
            Didn't receive the code?{' '}
            <button className="text-pink-500 hover:text-pink-600 font-semibold transition">
              Resend
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
