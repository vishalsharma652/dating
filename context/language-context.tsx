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
    dashboard: 'Dashboard',
    allUsers: 'All Users',
    chats: 'Chats',
    wallet: 'Wallet',
    coins: 'Coins',
    earnings: 'Earnings',
    settings: 'Settings',
    sayHi: 'Say Hi 👋',
    startChat: 'Start Chat',
    rechargeNow: 'Recharge Now',
    virtualGift: 'Virtual Gift',
    camera: 'Camera',
    gallery: 'Photo / Gallery',
    search: 'Search',
    online: 'Online',
    offline: 'Offline',
    language: 'Language',
    selectLanguage: 'Select Language',
    english: 'English',
    hindi: 'Hindi (हिंदी)',
    myProfile: 'My Profile',
    logout: 'Log Out',
    helpSupport: 'Help & Support',
    notifications: 'Notifications',
    buyCoins: 'Buy Coins',
    withdraw: 'Withdraw',
    deleteForMe: 'Delete for me',
    deleteForEveryone: 'Delete for everyone',
    typeMessage: 'Type a message...',
    lowCoinsNotice: 'Low coins balance. Recharge to keep chatting.',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    allUsers: 'सभी यूज़र्स',
    chats: 'चैट्स',
    wallet: 'वॉलेट',
    coins: 'कॉइन्स',
    earnings: 'कमाई',
    settings: 'सेटिंग्स',
    sayHi: 'से हाय 👋',
    startChat: 'चैट शुरू करें',
    rechargeNow: 'रिचार्ज करें',
    virtualGift: 'वर्चुअल गिफ्ट',
    camera: 'कैमरा',
    gallery: 'फोटो / गैलरी',
    search: 'खोजें',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    english: 'English',
    hindi: 'Hindi (हिंदी)',
    myProfile: 'मेरी प्रोफाइल',
    logout: 'लॉग आउट',
    helpSupport: 'हेल्प एवं सपोर्ट',
    notifications: 'नोटिफिकेशन',
    buyCoins: 'कॉइन्स खरीदें',
    withdraw: 'पैसे निकालें',
    deleteForMe: 'मेरे लिए हटाएं',
    deleteForEveryone: 'सभी के लिए हटाएं',
    typeMessage: 'मैसेज टाइप करें...',
    lowCoinsNotice: 'कम कॉइन्स बैलेंस। चैट जारी रखने के लिए रिचार्ज करें।',
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
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang === 'en' || savedLang === 'hi') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
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

export function LanguageModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language, setLanguage } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0D1424] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select Language / भाषा चुनें</h3>
              <p className="text-[11px] text-zinc-400">Choose app interface language</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              onClose();
            }}
            className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
              language === 'en'
                ? 'bg-pink-500/15 border-pink-500/40 text-pink-400 font-bold'
                : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇬🇧</span>
              <div>
                <div className="text-xs font-bold">English</div>
                <div className="text-[10px] text-zinc-400">Default language</div>
              </div>
            </div>
            {language === 'en' && <Check size={16} className="text-pink-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage('hi');
              onClose();
            }}
            className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
              language === 'hi'
                ? 'bg-pink-500/15 border-pink-500/40 text-pink-400 font-bold'
                : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇮🇳</span>
              <div>
                <div className="text-xs font-bold">Hindi (हिंदी)</div>
                <div className="text-[10px] text-zinc-400">भारतीय हिंदी भाषा</div>
              </div>
            </div>
            {language === 'hi' && <Check size={16} className="text-pink-400" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-bold text-zinc-300 hover:bg-white/15 transition cursor-pointer"
        >
          Close / बंद करें
        </button>
      </div>
    </div>
  );
}
