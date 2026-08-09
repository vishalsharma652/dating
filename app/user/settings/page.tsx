'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi, clearAuthSession, userApi } from '@/lib/api';
import {
  Lock,
  Bell,
  Languages,
  HelpCircle,
  LogOut,
  Trash2,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'notifications' | 'language' | null>(null);

  // Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    chatAlerts: true,
    matchAlerts: true,
    emailDigest: false,
  });

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [toastMsg, setToastMsg] = useState('');

  // Load language from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_language');
      if (savedLang) {
        setSelectedLanguage(savedLang);
      }
      const savedNotifications = localStorage.getItem('app_notifications');
      if (savedNotifications) {
        try {
          setNotificationSettings(JSON.parse(savedNotifications));
        } catch {}
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout fallback
    } finally {
      clearAuthSession();
      router.push('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await userApi.deleteAccount();
      } catch {
        // Continue clearing session
      } finally {
        clearAuthSession();
        router.push('/');
      }
    }
  };

  const handleSaveLanguage = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', selectedLanguage);
      window.dispatchEvent(new CustomEvent('language:changed', { detail: { language: selectedLanguage } }));
    }
    setActiveModal(null);
    showToast(`App Language changed to: ${selectedLanguage}`);
  };

  const handleSaveNotifications = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_notifications', JSON.stringify(notificationSettings));
    }
    setActiveModal(null);
    showToast('Notification preferences saved successfully!');
  };

  const languagesList = [
    { code: 'en', name: 'English', native: 'English (Default)', icon: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी (Hindi)', icon: '🇮🇳' },
    { code: 'hinglish', name: 'Hinglish', native: 'Hinglish (Hindi + English)', icon: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ (Punjabi)', icon: '🇮🇳' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা (Bengali)', icon: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી (Gujarati)', icon: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी (Marathi)', icon: '🇮🇳' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ் (Tamil)', icon: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు (Telugu)', icon: '🇮🇳' },
  ];

  const settings = [
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Manage push and chat notification preferences',
      action: () => setActiveModal('notifications'),
    },
    {
      id: 'security',
      icon: Lock,
      label: 'Security',
      description: 'Password and authentication settings',
      href: '/user/settings/security',
    },
    {
      id: 'language',
      icon: Languages,
      label: 'Language',
      description: `Active Language: ${selectedLanguage}`,
      action: () => setActiveModal('language'),
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      href: '/user/help',
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Global Toast Message */}
        {toastMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Settings List */}
        <div className="space-y-2.5 mb-8">
          {settings.map((setting) => {
            const Icon = setting.icon;
            const content = (
              <Card
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer group"
                onClick={setting.action}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500 group-hover:scale-105 transition">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{setting.label}</p>
                      <p className="text-sm text-zinc-400">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-500 group-hover:text-white transition" size={20} />
                </div>
              </Card>
            );

            return setting.href ? (
              <Link key={setting.id} href={setting.href}>
                {content}
              </Link>
            ) : (
              <div key={setting.id}>{content}</div>
            );
          })}
        </div>

        {/* Account Section */}
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-2.5 mb-8">
          <Card
            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer group"
            onClick={handleLogout}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-105 transition">
                  <LogOut size={22} />
                </div>
                <div>
                  <p className="font-semibold text-white">Logout</p>
                  <p className="text-sm text-zinc-400">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-500 group-hover:text-white transition" size={20} />
            </div>
          </Card>

          <Card
            className="p-4 hover:bg-red-500/10 transition cursor-pointer group"
            onClick={handleDeleteAccount}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
                  <Trash2 size={22} />
                </div>
                <div>
                  <p className="font-semibold text-red-400">
                    Delete Account
                  </p>
                  <p className="text-sm text-zinc-400">
                    Permanently delete your account
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-500 group-hover:text-white transition" size={20} />
            </div>
          </Card>
        </div>
      </Container>

      {/* 1. Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Bell size={20} className="text-[#EC4899]" />
                <span>Notification Preferences</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Push Notifications</p>
                  <p className="text-xs text-zinc-400">Receive alerts on your device</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                  className="w-5 h-5 accent-[#EC4899] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Chat & Message Alerts</p>
                  <p className="text-xs text-zinc-400">Notify when someone sends a message</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.chatAlerts}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, chatAlerts: e.target.checked })}
                  className="w-5 h-5 accent-[#EC4899] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Follow & Match Alerts</p>
                  <p className="text-xs text-zinc-400">Notify on new followers or matches</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.matchAlerts}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, matchAlerts: e.target.checked })}
                  className="w-5 h-5 accent-[#EC4899] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Email Updates</p>
                  <p className="text-xs text-zinc-400">Receive weekly digest via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailDigest}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, emailDigest: e.target.checked })}
                  className="w-5 h-5 accent-[#EC4899] cursor-pointer"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSaveNotifications}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}

      {/* 2. Language Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Languages size={20} className="text-purple-400" />
                <span>Choose App Language</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguage === lang.name;
                return (
                  <div
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.name)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                        : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.icon}</span>
                      <div>
                        <p className={`text-sm font-extrabold ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                          {lang.name}
                        </p>
                        <p className="text-xs text-zinc-400">{lang.native}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-400">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleSaveLanguage}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Apply Language
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
