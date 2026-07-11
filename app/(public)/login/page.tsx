'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi, setAuthSession } from '@/lib/api';
import { Brand } from '@/components/brand';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const identifier = formData.email.trim();
      const data = await authApi.login({
        ...(identifier.includes('@') ? { email: identifier } : { phone: identifier }),
        password: formData.password,
      });
      setAuthSession(data.token, data.user);
      router.push('/user/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_30%)] p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <Brand className="justify-center mb-4" imageClassName="h-14 w-14" />
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Sign in and continue onboarding your Saathika profile.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="Email address or mobile number"
                type="text"
                className="pl-12"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                className="pl-12 pr-12"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-pink-500 focus:ring-pink-500"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-pink-500 font-semibold hover:text-pink-600">
                Forgot password?
              </Link>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            New to Saathika?{' '}
            <Link href="/register" className="font-semibold text-pink-500 hover:text-pink-600">
              Create account
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
