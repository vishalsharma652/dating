'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function SecurityPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/user/settings">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Security Settings</h1>
        </div>

        {/* Two-Factor Authentication */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Add extra security to your account
                </p>
              </div>
              <Badge className="bg-green-500">Enabled</Badge>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Two-factor authentication is currently enabled on your account. You'll be asked to enter a code from your phone when you sign in.
            </p>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-zinc-400"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-3 text-zinc-400"
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-3 text-zinc-400"
                  >
                    {showConfirm ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <Button className="w-full">Update Password</Button>
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
            <div className="space-y-3">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">Chrome on Windows</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      192.168.1.1 • Last active now
                    </p>
                  </div>
                  <Badge className="bg-green-500">Current</Badge>
                </div>
              </div>

              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Safari on iPhone</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      192.168.1.5 • Last active 2 hours ago
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Login History */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Login Activity</h2>
            <div className="space-y-3">
              {[
                { device: 'Chrome on Windows', time: 'Today at 10:30 AM', ip: '192.168.1.1' },
                { device: 'Safari on iPhone', time: 'Yesterday at 3:45 PM', ip: '192.168.1.5' },
                { device: 'Chrome on Windows', time: '2 days ago', ip: '192.168.1.1' },
              ].map((login, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-zinc-200/80 dark:border-zinc-800 last:border-0"
                >
                  <div>
                    <p className="font-medium">{login.device}</p>
                    <p className="text-sm text-zinc-500">{login.ip}</p>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {login.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
