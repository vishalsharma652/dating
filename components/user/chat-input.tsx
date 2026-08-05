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
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { userApi, apiAssetUrl } from '@/lib/api';
import { CameraCaptureModal } from '@/components/user/camera-capture-modal';

interface ChatInputProps {
  onSend?: (message: string, type?: 'text' | 'image' | 'gift' | 'say_hi') => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & People',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
      '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
      '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
      '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
      '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
      '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '舌', '👄', '💋'
    ]
  },
  {
    id: 'love',
    name: 'Hearts & Romance',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨', '👩‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '👨‍❤️‍💋‍👨', '🌹', '🥀', '🌺', '🌻',
      '🌼', '🌷', '💐', '🌸', '💒', '💍', '👑', '🥂', '🍾', '🎁'
    ]
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔',
      '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟',
      '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙',
      '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋',
      '🦈', '🐊', '🐅', '🐆', '🐘', '🦏', '🦛', '🐪', '🐫', '🦒'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍕',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🍳', 'バター', '🥞', '🧇',
      '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙',
      '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣',
      '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕',
      '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸'
    ]
  },
  {
    id: 'activity',
    name: 'Activity & Sports',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️',
      '🏇', '🧘', '🏄', '🏊', '🚣', '🧗', '🚴', '🏆', '🥇', '🥈',
      '🥉', '🏅', '🎖️', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',
      '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🎯', ' bowling', '🎮'
    ]
  },
  {
    id: 'travel',
    name: 'Travel & Objects',
    icon: '🚀',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🛺', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚨', '🚔',
      '✈️', '🛫', '🛬', '🛸', '🚀', '🛰️', '⛵', '🚤', '🛳️', '⛴️',
      '🚢', '⚓', '⛽', '🚦', '🗺️', '🗽', '🗼', '🏰', '🏟️', '🎡',
      '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🌋', '⛰️', '🏕️', '🏠'
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols & Fire',
    icon: '🔥',
    emojis: [
      '🔥', '✨', '💥', '💫', '🎉', '🎊', '🎈', '🎆', '🎇', '🎁',
      '⭐', '🌟', '⚡', '🌈', '☀️', '🌙', '💯', '♨️', '📍', '🚩',
      '🏁', '🔔', '📣', '💡', '💎', '🔑', '🔒', '🔓', '💰', '💸',
      '💳', '💣', '🛡️', '❤️‍🔥', '🎶', '🎵', '🔞', '✅', '❌', '⚠️'
    ]
  }
];

const SAY_HI_QUESTIONS = [
  'Hey! How is your day going? 😊',
  'Hi there! Would you like to connect and chat? ✨',
  'Hello! You have a lovely profile 😊',
  'Hi! What are your favorite hobbies? 🌟',
  'Hey! Coffee or tea person? ☕',
];

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSayHiPicker, setShowSayHiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachmentMenu(false);
    setUploading(true);
    const form = new FormData();
    form.append('photo', file);

    try {
      const data = await userApi.uploadPhoto(form);
      const photoUrl = apiAssetUrl(data.url) || data.url;
      if (photoUrl) {
        await onSend?.(photoUrl, 'image');
      }
    } catch (err) {
      console.error('Photo upload failed', err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCameraCapture = async (file: File) => {
    setShowAttachmentMenu(false);
    setUploading(true);
    const form = new FormData();
    form.append('photo', file);

    try {
      const data = await userApi.uploadPhoto(form);
      const photoUrl = apiAssetUrl(data.url) || data.url;
      if (photoUrl) {
        await onSend?.(photoUrl, 'image');
      }
    } catch (err) {
      console.error('Camera photo upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const sendGift = (giftName: string, giftIcon: string, price?: number) => {
    const priceText = price ? ` (${price} Coins)` : '';
    onSend?.(`🎁 Sent a ${giftName} ${giftIcon}${priceText}`, 'gift');
    setShowGiftPicker(false);
    setShowAttachmentMenu(false);
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className="shrink-0 bg-[#0D1120]/95 backdrop-blur-xl border-t border-white/10 p-2.5 sm:p-3.5 z-20 relative">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
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
                setShowCameraModal(true);
                setShowAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold transition"
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

            <button
              type="button"
              onClick={() => {
                setShowSayHiPicker(true);
                setShowAttachmentMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-semibold transition"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Sparkles size={16} />
              </div>
              <span>Say Hi 👋 (5 Coins)</span>
            </button>
          </div>
        </div>
      )}

      {/* Say Hi Questions Drawer */}
      {showSayHiPicker && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-[#0F172A] border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Sparkles size={14} /> 5 Auto Say Hi Questions (5 Coins Only)
            </h4>
            <button
              type="button"
              onClick={() => setShowSayHiPicker(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-full bg-white/5"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {SAY_HI_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onSend?.(q, 'say_hi');
                  setShowSayHiPicker(false);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 text-white text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2"
              >
                <span>{q}</span>
                <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20 whitespace-nowrap">
                  5 Coins
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Style Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 right-0 p-3 bg-[#0F172A]/98 border-t border-white/10 backdrop-blur-2xl shadow-2xl z-30 animate-in slide-in-from-bottom-2 duration-200 flex flex-col max-h-80">
          {/* Header Bar: Category Tabs + Search Input + Close */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveEmojiCategory(cat.id);
                    setEmojiSearchQuery('');
                  }}
                  className={`text-lg p-1.5 rounded-xl transition duration-150 shrink-0 cursor-pointer ${
                    activeEmojiCategory === cat.id && !emojiSearchQuery
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 font-bold scale-110'
                      : 'hover:bg-white/10 text-zinc-400'
                  }`}
                  title={cat.name}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-36 sm:w-48 shrink-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Emojis..."
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-pink-500/50"
              />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Emojis Grid */}
          <div className="overflow-y-auto flex-1 p-1 max-h-56 pr-1 space-y-3 scrollbar-none">
            {emojiSearchQuery.trim() ? (
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 mb-1.5 px-1">
                  Search Results
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                  {EMOJI_CATEGORIES.flatMap((cat) => cat.emojis)
                    .filter((emoji, idx, self) => self.indexOf(emoji) === idx)
                    .map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl p-1.5 rounded-xl hover:bg-white/15 transition hover:scale-125 cursor-pointer flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              EMOJI_CATEGORIES.filter((cat) => cat.id === activeEmojiCategory).map((cat) => (
                <div key={cat.id}>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 mb-1.5 px-1 flex items-center gap-1.5">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1">
                    {cat.emojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl p-1.5 rounded-xl hover:bg-white/15 transition hover:scale-125 cursor-pointer flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Gift Picker Drawer */}
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
              { name: 'Red Rose', icon: '🌹', price: 10 },
              { name: 'Love Heart', icon: '💖', price: 25 },
              { name: 'Golden Crown', icon: '👑', price: 50 },
              { name: 'Sparkling Ring', icon: '💍', price: 100 },
            ].map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => sendGift(g.name, g.icon, g.price)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition group cursor-pointer"
              >
                <span className="text-2xl mb-1 group-hover:scale-125 transition duration-200">
                  {g.icon}
                </span>
                <span className="text-[10px] font-bold text-zinc-300 truncate">
                  {g.name}
                </span>
                <span className="mt-1 text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/30 whitespace-nowrap">
                  🪙 {g.price} Coins
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

      {/* Live System Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
