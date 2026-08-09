'use client';

import {
  Send,
  Smile,
  Image as ImageIcon,
  Gift,
  X,
  Paperclip,
  Camera,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { userApi, apiAssetUrl } from '@/lib/api';
import { CameraCaptureModal } from '@/components/user/camera-capture-modal';
import { WhatsAppEmojiPicker } from '@/components/user/whatsapp-emoji-picker';

interface ChatInputProps {
  onSend?: (message: string, type?: 'text' | 'image' | 'gift') => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(e.target as Node)
      ) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = message.trim();
    if (!textToSend || sending || uploading) return;

    try {
      setSending(true);
      await onSend?.(textToSend, 'text');
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCapturedFile = async (file: File) => {
    setShowAttachmentMenu(false);
    setUploading(true);
    const form = new FormData();
    form.append('media', file);

    try {
      const data = await userApi.uploadChatMedia(form);
      const photoUrl = apiAssetUrl(data.url) || data.url;
      if (photoUrl) {
        await onSend?.(photoUrl, 'image');
      }
    } catch (err) {
      console.error('Chat media upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleCapturedFile(file);
    if (e.target) e.target.value = '';
  };

  const sendGift = (giftName: string, giftIcon: string, giftCoins: number) => {
    onSend?.(`🎁 Sent a ${giftName} ${giftIcon} (${giftCoins} Coins)`, 'gift');
    setShowGiftPicker(false);
    setShowAttachmentMenu(false);
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className="shrink-0 bg-[#0D1120]/95 backdrop-blur-xl border-t border-white/10 p-2.5 sm:p-3.5 z-20 relative">
      {/* Live System Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCapturedFile}
      />

      {/* Hidden File Inputs for Native System Camera & Gallery */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handlePhotoUpload}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
      />

      {/* Attachment Popover Menu */}
      {showAttachmentMenu && (
        <div
          ref={attachmentMenuRef}
          className="absolute bottom-full left-4 mb-2 p-3 bg-[#0F172A] border border-white/15 rounded-2xl shadow-2xl z-30 animate-in slide-in-from-bottom-2 duration-200 w-56 backdrop-blur-2xl"
        >
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Share Media & Gifts
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setShowAttachmentMenu(false);
                setShowCameraModal(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Camera size={16} />
              </div>
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold transition"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <ImageIcon size={16} />
              </div>
              <span>Photo / Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowGiftPicker(true);
                setShowAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold transition"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Gift size={16} />
              </div>
              <span>Send Gift</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Style Categorized Emoji Picker Drawer */}
      {showEmojiPicker && (
        <WhatsAppEmojiPicker
          onSelectEmoji={(emoji) => addEmoji(emoji)}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Gift Picker Drawer with Coin Prices */}
      {showGiftPicker && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-[#0F172A] border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-30">
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
              { name: 'Red Rose', icon: '🌹', coins: 10 },
              { name: 'Love Heart', icon: '💖', coins: 25 },
              { name: 'Chocolate', icon: '🍫', coins: 50 },
              { name: 'Teddy Bear', icon: '🧸', coins: 100 },
              { name: 'Golden Crown', icon: '👑', coins: 200 },
              { name: 'Diamond Ring', icon: '💍', coins: 500 },
              { name: 'Sports Car', icon: '🚗', coins: 1000 },
              { name: 'Super Diamond', icon: '💎', coins: 2000 },
            ].map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => sendGift(g.name, g.icon, g.coins)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition group cursor-pointer space-y-1"
              >
                <span className="text-2xl group-hover:scale-125 transition duration-200">
                  {g.icon}
                </span>
                <span className="text-[10px] font-bold text-zinc-300 truncate">
                  {g.name}
                </span>
                <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  🪙 {g.coins} coins
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* Rounded Input Text Pill with Emoji & Paperclip inside */}
        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 focus-within:border-[#EC4899] focus-within:bg-white/[0.08] transition duration-200 min-w-0">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-1 text-zinc-400 hover:text-amber-400 transition shrink-0 cursor-pointer"
            title="Choose Emoji"
          >
            <Smile size={19} />
          </button>

          {/* Multi-line Resizing Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={uploading ? 'Uploading photo...' : 'Type a message...'}
            disabled={uploading || sending}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent px-2.5 py-1 text-base sm:text-sm text-white placeholder-zinc-400 focus:outline-none resize-none max-h-32 leading-relaxed"
          />

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            title="Attach Media / Camera / Gift"
            disabled={uploading || sending}
            onClick={() => setShowAttachmentMenu((prev) => !prev)}
            className={`p-1 transition shrink-0 cursor-pointer ${
              showAttachmentMenu ? 'text-[#EC4899]' : 'text-zinc-400 hover:text-pink-400'
            }`}
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Send Button with Loading Spinner */}
        <Button
          type="submit"
          disabled={!message.trim() || uploading || sending}
          className="rounded-full w-11 h-11 p-0 shrink-0 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center text-white border-0 shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-95 cursor-pointer"
        >
          {uploading || sending ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="translate-x-[1px]" />
          )}
        </Button>
      </form>
    </div>
  );
}
