'use client';

import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, FormEvent } from 'react';

interface ChatInputProps {
  onSend?: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend?.(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="shrink-0 bg-[#0D1120]/95 backdrop-blur-xl border-t border-white/10 p-2.5 sm:p-3 z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* WhatsApp-style Input Pill */}
        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 focus-within:border-[#EC4899] transition duration-200">
          <button type="button" className="p-1 text-zinc-400 hover:text-zinc-200 transition">
            <Smile size={20} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent px-3 py-1.5 text-base sm:text-sm text-white placeholder-zinc-400 focus:outline-none"
          />
          <button type="button" className="p-1 text-zinc-400 hover:text-zinc-200 transition">
            <Paperclip size={18} />
          </button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim()}
          className="rounded-full w-11 h-11 p-0 shrink-0 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center text-white border-0 shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-95"
        >
          <Send size={18} className="translate-x-[1px]" />
        </Button>
      </form>
    </div>
  );
}
