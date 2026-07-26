'use client';

import { Send } from 'lucide-react';
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
    <div className="shrink-0 bg-[#070B18]/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5 max-w-4xl mx-auto">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4.5 py-3 text-base sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-[#EC4899] focus:ring-1 focus:ring-[#EC4899] transition duration-200"
        />
        <Button
          type="submit"
          disabled={!message.trim()}
          className="rounded-full w-11 h-11 p-0 shrink-0 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-90 disabled:opacity-40 transition-all duration-200 flex items-center justify-center text-white border-0 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
        >
          <Send size={18} className="translate-x-[1px]" />
        </Button>
      </form>
    </div>
  );
}
