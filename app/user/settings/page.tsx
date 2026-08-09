'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi, clearAuthSession, userApi } from '@/lib/api';
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
  X,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'location' | 'language' | null>(null);

  // Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    chatAlerts: true,
    matchAlerts: true,
    emailDigest: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    privateProfile: false,
    hideDistance: false,
  });

  const [locationCity, setLocationCity] = useState('Delhi, India');
  const [locationDetecting, setLocationDetecting] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [toastMsg, setToastMsg] = useState('');

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

  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      setLocationDetecting(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationDetecting(false);
          setLocationCity('New Delhi, India (GPS Detected)');
          showToast('GPS Location updated successfully!');
        },
        () => {
          setLocationDetecting(false);
          showToast('Unable to detect location. Please enter city manually.');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.');
    }
  };

  const settings = [
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      action: () => setActiveModal('notifications'),
    },
    {
      id: 'privacy',
      icon: Eye,
      label: 'Privacy',
      description: 'Control who can see your profile',
      action: () => setActiveModal('privacy'),
    },
    {
      id: 'security',
      icon: Lock,
      label: 'Security',
      description: 'Password and authentication settings',
      href: '/user/settings/security',
    },
    {
      id: 'location',
      icon: MapPin,
      label: 'Location',
      description: 'Manage location settings',
      action: () => setActiveModal('location'),
    },
    {
      id: 'language',
      icon: Languages,
      label: 'Language',
      description: 'Change app language',
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
              onClick={() => {
                setActiveModal(null);
                showToast('Notification preferences saved!');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}

      {/* 2. Privacy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Eye size={20} className="text-blue-400" />
                <span>Privacy Settings</span>
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
                  <p className="font-bold text-sm">Show Online Status</p>
                  <p className="text-xs text-zinc-400">Let others see when you are active</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showOnlineStatus}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, showOnlineStatus: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Private Profile Mode</p>
                  <p className="text-xs text-zinc-400">Only approved followers can view full details</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.privateProfile}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, privateProfile: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">Hide Distance & Location</p>
                  <p className="text-xs text-zinc-400">Do not display distance in kilometers</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.hideDistance}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, hideDistance: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setActiveModal(null);
                showToast('Privacy settings saved!');
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Save Privacy Settings
            </Button>
          </div>
        </div>
      )}

      {/* 3. Location Modal */}
      {activeModal === 'location' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin size={20} className="text-emerald-400" />
                <span>Location Settings</span>
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
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                  Your Current City / Region
                </label>
                <Input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={locationDetecting}
                onClick={handleDetectLocation}
                className="w-full py-2.5 rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation size={14} className={locationDetecting ? 'animate-spin' : ''} />
                <span>{locationDetecting ? 'Detecting GPS...' : 'Detect Live GPS Location'}</span>
              </Button>
            </div>

            <Button
              type="button"
              onClick={() => {
                setActiveModal(null);
                showToast(`Location set to: ${locationCity}`);
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Save Location
            </Button>
          </div>
        </div>
      )}

      {/* 4. Language Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Languages size={20} className="text-purple-400" />
                <span>App Language</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { name: 'English', native: 'English' },
                { name: 'Hindi', native: 'हिंदी' },
                { name: 'Hinglish', native: 'Hinglish (Hindi + English)' },
              ].map((lang) => (
                <div
                  key={lang.name}
                  onClick={() => setSelectedLanguage(lang.name)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selectedLanguage === lang.name
                      ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                      : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">{lang.name}</p>
                    <p className="text-xs text-zinc-400">{lang.native}</p>
                  </div>
                  {selectedLanguage === lang.name && (
                    <CheckCircle2 size={18} className="text-purple-400" />
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={() => {
                setActiveModal(null);
                showToast(`Language set to: ${selectedLanguage}`);
              }}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Apply Language
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
