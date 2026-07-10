'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi, clearAuthSession } from '@/lib/api';
import {
  Lock,
  Bell,
  Eye,
  MapPin,
  Languages,
  HelpCircle,
  LogOut,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const settings = [
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      href: '#',
    },
    {
      icon: Eye,
      label: 'Privacy',
      description: 'Control who can see your profile',
      href: '#',
    },
    {
      icon: Lock,
      label: 'Security',
      description: 'Password and authentication settings',
      href: '/user/settings/security',
    },
    {
      icon: MapPin,
      label: 'Location',
      description: 'Manage location settings',
      href: '#',
    },
    {
      icon: Languages,
      label: 'Language',
      description: 'Change app language',
      href: '#',
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      href: '/user/help',
    },
  ];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still complete if the session is already expired.
    } finally {
      clearAuthSession();
      router.push('/');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Settings List */}
        <div className="space-y-2 mb-8">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <Link key={setting.label} href={setting.href}>
                <Card className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Icon className="text-pink-500" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold">{setting.label}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-zinc-400" size={24} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Account */}
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-2 mb-8">
          <Card
            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={handleLogout}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') handleLogout();
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <LogOut className="text-yellow-500" size={24} />
                </div>
                <div>
                  <p className="font-semibold">Logout</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-400" size={24} />
            </div>
          </Card>

          <Card className="p-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    Delete Account
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Permanently delete your account
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-400" size={24} />
            </div>
          </Card>
        </div>

        {/* About */}
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <Card>
          <div className="p-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span>App Version</span>
              <span className="font-semibold">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span className="font-semibold">July 3, 2024</span>
            </div>
            <div className="flex gap-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
              <Button variant="ghost" size="sm">
                Terms of Service
              </Button>
              <Button variant="ghost" size="sm">
                Privacy Policy
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
