'use client';

import { useState } from 'react';
import { Search, X, Smile, Heart, ThumbsUp, Dog, Pizza, PartyPopper, Sparkles } from 'lucide-react';

interface WhatsAppEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
      '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😮‍💨', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
      '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ]
  },
  {
    id: 'hearts',
    name: 'Love & Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '💋', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨', '🌹', '🌺', '🌸', '🌼', '🌻', '💐', '🌷'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & Hands',
    icon: '👍',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐',
      '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🤝', '🙌', '👐', '🤲', '👏'
    ]
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔',
      '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟',
      '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: '🍔',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦',
      '🥒', '🌽', '🥕', '🥔', '🥐', '🍞', '🥖', '🥨', '🧀', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕',
      '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍨', '🍦', '🥧', '🧁', '🍰',
      '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '☕️', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹'
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Party',
    icon: '🎉',
    emojis: [
      '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🎮', '🕹', '🎲', '🎯', '🎳', '🥊', '🥋',
      '🎨', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎬', '🍿', '🎭', '🎉', '🎊', '🎈', '🎂', '🎄', '🎆',
      '🎇', '✨', '🎁', '🎀', '🎗', '🏵'
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols & Objects',
    icon: '💎',
    emojis: [
      '❤️', '🔥', '✨', '⭐', '🌟', '💫', '💥', '💢', '💦', '💧', '💨', '⚡️', '🌈', '☀️', '🌤', '⛅️', '☁️', '🌧', '⛈', '❄️',
      '🔔', '🔕', '💎', '🔑', '🏷', '📍', '📌', '💯', '♨️', '⚠️', '🚫', '⛔️', '‼️', '⁉️', '❓', '❗', '⭕️', '❌', '👑', '💍'
    ]
  }
];

export function WhatsAppEmojiPicker({ onSelectEmoji, onClose }: WhatsAppEmojiPickerProps) {
  const [activeTab, setActiveTab] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = EMOJI_CATEGORIES.find((cat) => cat.id === activeTab) || EMOJI_CATEGORIES[0];

  const allFilteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : currentCategory.emojis;

  return (
    <div className="absolute bottom-full left-0 right-0 max-h-72 bg-[#0F172A]/95 border-t border-white/10 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-2 duration-200 z-30 flex flex-col overflow-hidden rounded-t-3xl">
      {/* Header with Search & Close */}
      <div className="flex items-center gap-2 p-2.5 border-b border-white/10 bg-black/20">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none placeholder-zinc-500 text-xs"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* WhatsApp Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-around px-2 py-1.5 border-b border-white/5 bg-white/[0.02]">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`p-1.5 rounded-xl transition duration-150 text-base flex items-center justify-center cursor-pointer ${
                activeTab === cat.id ? 'bg-pink-500/20 text-pink-400 scale-110 border border-pink-500/30' : 'opacity-60 hover:opacity-100 hover:bg-white/5'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-white/10">
        {!searchQuery && (
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 mb-2">
            {currentCategory.name}
          </div>
        )}
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 text-center">
          {allFilteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="text-2xl p-1.5 hover:bg-white/10 rounded-xl transition duration-150 hover:scale-125 cursor-pointer flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
