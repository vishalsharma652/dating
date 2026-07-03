'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

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
            <h1 className="text-3xl font-bold mb-2">Create New Password</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter a strong password for your account
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="New password"
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

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-3 text-zinc-400" size={20} />
              <Input
                placeholder="Confirm password"
                type={showConfirm ? 'text' : 'password'}
                className="pl-12 pr-12"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>✓ At least 8 characters</p>
              <p>✓ Contains uppercase letter</p>
              <p>✓ Contains number</p>
            </div>

            {/* Reset Button */}
            <Button className="w-full h-11 mt-6">Reset Password</Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
