'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, X, ExternalLink } from 'lucide-react';
import { connectSocket } from '@/lib/socket';
import { apiAssetUrl, getStoredUser } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';

interface MessageToastData {
  id: number | string;
  chatId: number | string;
  senderId: number | string;
  senderName: string;
  senderPhoto: string;
  senderUniqueId: string;
  text: string;
  type: string;
}

export function MessageToast() {
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState<MessageToastData | null>(null);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio playback blocked by browser policy until user interacts
    }
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    const handleChatMessage = (data: MessageToastData) => {
      if (!data) return;

      const storedUser = getStoredUser();
      if (storedUser && String(data.senderId) === String(storedUser.id)) {
        return; // Ignore messages sent by self
      }

      // Check if user is currently inside the chat room with this sender
      const targetSlug = data.senderUniqueId || String(data.senderId).padStart(6, '0');
      const isInsideSenderChatRoom = pathname === `/user/chat/${targetSlug}` || pathname === `/user/chat/${data.senderId}`;

      // Always dispatch window event so active pages can update live
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat:new_message', { detail: data }));
      }

      // Only show top notification toast if NOT inside that specific chat room
      if (!isInsideSenderChatRoom) {
        setToast(data);
        playChime();
      }
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [pathname, playChime]);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const targetSlug = toast.senderUniqueId || String(toast.senderId).padStart(6, '0');
  const storedUser = getStoredUser();
  const isBoyUser = String(storedUser?.gender || '').toLowerCase() === 'male';
  const defaultAvatar = isBoyUser ? '/female-logo.svg' : '/male-logo.svg';
  const photoVal = toast.senderPhoto && toast.senderPhoto.trim()
    ? (apiAssetUrl(toast.senderPhoto) || toast.senderPhoto)
    : defaultAvatar;

  const handleOpenChat = () => {
    setToast(null);
    router.push(`/user/chat/${targetSlug}`);
  };

  return (
    <div className="fixed top-5 right-4 left-4 sm:left-auto sm:w-96 z-[9999] animate-in slide-in-from-top-5 duration-300">
      <div className="p-4 rounded-2xl bg-[#0D1424]/95 border border-[#EC4899]/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(236,72,153,0.3)] flex items-center justify-between gap-3 text-white">
        <div
          onClick={handleOpenChat}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
        >
          <div className="relative shrink-0">
            <Avatar src={photoVal} alt={toast.senderName} fallback={toast.senderName?.[0] || 'U'} className="w-11 h-11 border border-white/20" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#EC4899] to-[#7C3AED] flex items-center justify-center border-2 border-[#0D1424]">
              <MessageCircle size={10} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#EC4899] transition">
                {toast.senderName}
              </h4>
              <span className="text-[10px] text-pink-400 font-extrabold shrink-0 uppercase tracking-wide">
                New Message
              </span>
            </div>
            <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium">
              {toast.type === 'gift' ? '🎁 Sent a virtual gift!' : toast.text || 'Sent a message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpenChat}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Reply</span>
            <ExternalLink size={12} />
          </button>

          <button
            onClick={() => setToast(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
