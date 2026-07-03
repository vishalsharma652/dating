'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ChatInputProps {
  onSend?: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend?.(message);
      setMessage('');
    }
  };

  return (
    <div className="sticky bottom-0 bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800 p-4">
      <div className="flex gap-3">
        <Input
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <Button
          size="sm"
          className="rounded-full w-11 h-11 p-0"
          onClick={handleSend}
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
