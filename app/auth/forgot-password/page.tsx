'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {!submitted ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-3 text-zinc-400" size={20} />
                <Input
                  placeholder="Email address"
                  type="email"
                  className="pl-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full h-11 mt-6">Send Reset Link</Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
                <Mail className="text-pink-500" size={32} />
              </div>
              <div>
                <p className="font-semibold mb-1">Check your email</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Button
                className="w-full h-11 mt-6"
                asChild
              >
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
