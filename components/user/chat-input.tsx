'use client';

import { Send, Smile, Image as ImageIcon, Gift, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, FormEvent } from 'react';
import { userApi, apiAssetUrl } from '@/lib/api';

interface ChatInputProps {
  onSend?: (message: string, type?: 'text' | 'image' | 'gift') => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend?.(message.trim(), 'text');
      setMessage('');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('photo', file);

    try {
      const data = await userApi.uploadPhoto(form);
      const photoUrl = apiAssetUrl(data.url) || data.url;
      if (photoUrl) {
        onSend?.(photoUrl, 'image');
      }
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendGift = (giftName: string, giftIcon: string) => {
    onSend?.(`🎁 Sent a ${giftName} ${giftIcon}`, 'gift');
    setShowGiftPicker(false);
  };

  return (
    <div className="shrink-0 bg-[#0D1120]/95 backdrop-blur-xl border-t border-white/10 p-2.5 sm:p-3 z-20 relative">
      {/* Gift Picker Drawer */}
      {showGiftPicker && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-[#0F172A] border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Gift size={14} /> Send a Virtual Gift
            </h4>
            <button
              type="button"
              onClick={() => setShowGiftPicker(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Red Rose', icon: '🌹' },
              { name: 'Love Heart', icon: '💖' },
              { name: 'Golden Crown', icon: '👑' },
              { name: 'Sparkling Ring', icon: '💍' },
            ].map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => sendGift(g.name, g.icon)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition group cursor-pointer"
              >
                <span className="text-2xl mb-1 group-hover:scale-125 transition duration-200">{g.icon}</span>
                <span className="text-[10px] font-bold text-zinc-300 truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* Quick Action Buttons: Photo & Gift */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Photo Button */}
          <button
            type="button"
            title="Send Photo"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 text-pink-400 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon size={18} className="text-pink-400 shrink-0" />
            <span className="text-pink-400 font-extrabold">Photo</span>
          </button>

          {/* Gift Button */}
          <button
            type="button"
            title="Send Gift"
            onClick={() => setShowGiftPicker((prev) => !prev)}
            className="px-3 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Gift size={18} className="text-amber-400 shrink-0" />
            <span className="text-amber-400 font-extrabold">Gift</span>
          </button>
        </div>

        {/* Input Text Pill */}
        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 focus-within:border-[#EC4899] transition duration-200">
          <button type="button" className="p-1 text-zinc-400 hover:text-zinc-200 transition">
            <Smile size={19} />
          </button>
          <input
            type="text"
            placeholder={uploading ? "Uploading photo..." : "Type a message..."}
            disabled={uploading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent px-3 py-1.5 text-base sm:text-sm text-white placeholder-zinc-400 focus:outline-none"
          />
          <button
            type="button"
            title="Attach Photo"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-zinc-400 hover:text-pink-400 transition"
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || uploading}
          className="rounded-full w-11 h-11 p-0 shrink-0 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center text-white border-0 shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-95"
        >
          <Send size={18} className="translate-x-[1px]" />
        </Button>
      </form>
    </div>
  );
}
