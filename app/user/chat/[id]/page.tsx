'use client';

import { Container } from '@/components/ui/container';
import { ChatHeader } from '@/components/user/chat-header';
import { ChatInput } from '@/components/user/chat-input';
import { profiles, messages as mockMessages } from '@/lib/mockData';
import { use, useState } from 'react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const chatUser = profiles.find((p) => p.id === id) || profiles[0];
  const [messages, setMessages] = useState(mockMessages);

  const handleSend = (message: string) => {
    setMessages([
      ...messages,
      {
        id: `msg-${Date.now()}`,
        senderId: 'currentUser',
        senderName: 'You',
        text: message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'text',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-64px)]">
      <ChatHeader user={chatUser} online={true} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <Container>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                  msg.senderId === 'currentUser'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none'
                    : 'bg-zinc-200 dark:bg-zinc-800 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === 'currentUser'
                      ? 'text-white/70'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </Container>
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
