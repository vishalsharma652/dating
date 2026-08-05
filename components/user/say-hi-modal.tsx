'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, MessageCircle, Coins, Check, Loader2 } from 'lucide-react';
import { userApi } from '@/lib/api';

const SAY_HI_QUESTIONS = [
  'Hey! How is your day going? 😊',
  'Hi there! Would you like to connect and chat? ✨',
  'Hello! You have a lovely profile 😊',
  'Hi! What are your favorite hobbies? 🌟',
  'Hey! Coffee or tea person? ☕',
];

interface SayHiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number | string;
    name: string;
    photo?: string;
    location?: string;
  } | null;
  currentCoins?: number | null;
}

export function SayHiModal({ isOpen, onClose, targetUser, currentCoins }: SayHiModalProps) {
  const router = useRouter();
  const [selectedQuestion, setSelectedQuestion] = useState(SAY_HI_QUESTIONS[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !targetUser) return null;

  const handleSendSayHi = async () => {
    if (!targetUser || sending) return;
    setSending(true);
    setError('');

    try {
      await userApi.sendMessage(targetUser.id, selectedQuestion, 'say_hi');

      // Dispatch global wallet update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:wallet-updated', { detail: {} }));
      }

      onClose();
      router.push(`/user/chat/${targetUser.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send Say Hi message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0D1424] border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header with User Info */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/15 shadow-md flex-shrink-0">
            <img
              src={targetUser.photo || '/avatar-priya.jpg'}
              alt={targetUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-tight">Say Hi 👋 to {targetUser.name}</h3>
            </div>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Pick an icebreaker question to start chatting
            </p>
          </div>
        </div>

        {/* Discount Coin Cost Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/30">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
            <Sparkles size={16} className="text-amber-400 animate-pulse" />
            <span>Special Say Hi Rate: Only 5 Coins</span>
          </div>
          {currentCoins !== undefined && currentCoins !== null && (
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 bg-black/40 px-2.5 py-1 rounded-xl">
              <Coins size={13} className="text-amber-400" />
              <span>{currentCoins} coins</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 5 Auto Generated Questions Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 px-1">
            Choose an Icebreaker (5 Auto Questions)
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {SAY_HI_QUESTIONS.map((q) => {
              const isSelected = selectedQuestion === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuestion(q)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between gap-3 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#EC4899]/20 to-[#7C3AED]/20 border-[#EC4899] text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="leading-relaxed">{q}</span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                      isSelected ? 'bg-[#EC4899] text-white' : 'border border-white/20'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSendSayHi}
          disabled={sending}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#EC4899] via-pink-600 to-[#7C3AED] hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition disabled:opacity-50 cursor-pointer"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Sending Say Hi...</span>
            </>
          ) : (
            <>
              <MessageCircle size={18} />
              <span>Send Say Hi (5 Coins)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
