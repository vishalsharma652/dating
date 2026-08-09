'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & Sidebar
    dashboard: 'Dashboard',
    searchId: 'Search ID',
    chats: 'Chat',
    notifications: 'Notifications',
    wallet: 'Wallet',
    profile: 'Profile',
    myProfile: 'My Profile',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    logout: 'Logout',
    deleteAccount: 'Delete Account',
    account: 'Account',
    more: 'More',
    home: 'Home',
    alerts: 'Alerts',

    // Settings
    securitySettings: 'Security Settings',
    twoFactorAuth: 'Two-Factor Authentication',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    appLanguage: 'App Language',
    notificationPreferences: 'Notification Preferences',
    pushNotifications: 'Push Notifications',
    chatAlerts: 'Chat & Message Alerts',
    followAlerts: 'Follow & Match Alerts',
    emailUpdates: 'Email Updates',
    savePreferences: 'Save Preferences',
    applyLanguage: 'Apply Language',
    selectLanguage: 'Choose App Language',
    english: 'English',
    hindi: 'Hindi (हिंदी)',

    // Profile & Verification
    aboutMe: 'About Me',
    interestsHobbies: 'Interests & Hobbies',
    myPhotos: 'My Photos',
    myPhotosGallery: 'My Photos Gallery',
    coverPhoto: 'Main Cover Photo',
    setAsCover: 'Set as Cover',
    removePhoto: 'Remove Photo',
    addPhoto: 'Add Photo',
    verificationChecklist: 'Verification Checklist',
    profileSecurity: 'Profile Security',
    followStatus: 'Follow Status',
    followers: 'Followers',
    following: 'Following',
    socialNetwork: 'Social Network',
    uniqueId: 'Your Unique ID',
    copyId: 'Copy ID',
    editProfile: 'Edit Profile',
    shareProfile: 'Share Profile',
    report: 'Report',
    activeNow: 'Active Now',
    offline: 'Offline',
    verified: 'Verified',
    trustScore: 'Trust',

    // Chat & Social Actions
    sayHi: 'Say Hi 👋',
    startChat: 'Start Chat',
    follow: 'Follow',
    requested: 'Requested ⏳',
    followBack: 'Follow Back',
    accept: 'Accept',
    decline: 'Decline',
    unfollow: 'Unfollow',
    pinned: 'Pinned',
    pinChat: 'Pin Chat',
    unpinChat: 'Unpin Chat',
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    typeMessage: 'Type a message...',
    send: 'Send',
    rechargeNow: 'Recharge Now',
    buyCoins: 'Buy Coins',
    withdraw: 'Withdraw',
  },
  hi: {
    // Navigation & Sidebar
    dashboard: 'डैशबोर्ड',
    searchId: 'आईडी खोजें',
    chats: 'चैट',
    notifications: 'सूचनाएं',
    wallet: 'वॉलेट',
    profile: 'प्रोफाइल',
    myProfile: 'मेरी प्रोफाइल',
    settings: 'सेटिंग्स',
    helpSupport: 'मदद और सहायता',
    logout: 'लॉग आउट',
    deleteAccount: 'खाता हटाएं',
    account: 'खाता',
    more: 'अन्य',
    home: 'होम',
    alerts: 'अलर्ट',

    // Settings
    securitySettings: 'सुरक्षा सेटिंग्स',
    twoFactorAuth: 'टू-फैक्टर प्रमाणीकरण',
    changePassword: 'पासवर्ड बदलें',
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    updatePassword: 'पासवर्ड अपडेट करें',
    appLanguage: 'ऐप की भाषा',
    notificationPreferences: 'सूचना प्राथमिकताएं',
    pushNotifications: 'पुश नोटिफिकेशन',
    chatAlerts: 'चैट और मैसेज अलर्ट',
    followAlerts: 'फॉलो और मैच अलर्ट',
    emailUpdates: 'ईमेल अपडेट्स',
    savePreferences: 'प्राथमिकताएं सहेजें',
    applyLanguage: 'भाषा लागू करें',
    selectLanguage: 'ऐप की भाषा चुनें',
    english: 'English',
    hindi: 'हिंदी (Hindi)',

    // Profile & Verification
    aboutMe: 'मेरे बारे में',
    interestsHobbies: 'रुचियां और शौक',
    myPhotos: 'मेरी तस्वीरें',
    myPhotosGallery: 'फोटो गैलरी',
    coverPhoto: 'मुख्य कवर फोटो',
    setAsCover: 'कवर फोटो बनाएं',
    removePhoto: 'फोटो हटाएं',
    addPhoto: 'फोटो जोड़ें',
    verificationChecklist: 'सत्यापन चेकलिस्ट',
    profileSecurity: 'प्रोफाइल सुरक्षा',
    followStatus: 'फॉलो स्थिति',
    followers: 'फॉलोअर्स',
    following: 'फॉलोइंग',
    socialNetwork: 'सोशल नेटवर्क',
    uniqueId: 'आपकी यूनिक आईडी',
    copyId: 'आईडी कॉपी करें',
    editProfile: 'प्रोफाइल एडिट करें',
    shareProfile: 'प्रोफाइल शेयर करें',
    report: 'रिपोर्ट करें',
    activeNow: 'अभी सक्रिय',
    offline: 'ऑफलाइन',
    verified: 'सत्यापित',
    trustScore: 'विश्वास स्कोर',

    // Chat & Social Actions
    sayHi: 'नमस्ते कहें 👋',
    startChat: 'चैट शुरू करें',
    follow: 'फॉलो करें',
    requested: 'अनुरोध भेजा ⏳',
    followBack: 'फॉलो बैक करें',
    accept: 'स्वीकार करें',
    decline: 'अस्वीकार करें',
    unfollow: 'अनफॉलो करें',
    pinned: 'पिन किया गया',
    pinChat: 'चैट पिन करें',
    unpinChat: 'चैट अनपिन करें',
    voiceCall: 'वॉयस कॉल',
    videoCall: 'वीडियो कॉल',
    typeMessage: 'मैसेज लिखें...',
    send: 'भेजें',
    rechargeNow: 'रिचार्ज करें',
    buyCoins: 'कॉइन्स खरीदें',
    withdraw: 'पैसे निकालें',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_language');
      if (savedLang === 'hi' || savedLang === 'en') {
        setLanguageState(savedLang as Language);
        document.documentElement.lang = savedLang;
      } else if (savedLang === 'Hindi') {
        setLanguageState('hi');
        document.documentElement.lang = 'hi';
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent('language:changed', { detail: { language: lang } }));
    }
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcherButton() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition duration-200 shadow-sm cursor-pointer"
      title="Switch Language (English / हिंदी)"
    >
      <Globe size={14} className="text-pink-400" />
      <span>{language === 'en' ? 'EN | हिंदी' : 'हिंदी | EN'}</span>
    </button>
  );
}
