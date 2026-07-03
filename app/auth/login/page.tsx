'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Sign in to continue to Ember</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="Email address"
                type="email"
                className="pl-12"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                className="pl-12 pr-12"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-300 text-pink-500 cursor-pointer"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-pink-500 hover:text-pink-600 transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button className="w-full h-11 mt-6">Sign In</Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-sm text-zinc-500">Or continue with</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11">
              Google
            </Button>
            <Button variant="outline" className="h-11">
              Apple
            </Button>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm mt-6 text-zinc-600 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-pink-500 hover:text-pink-600 font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
