'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@/components/ui/container';
import { ChatHeader } from '@/components/user/chat-header';
import { ChatInput } from '@/components/user/chat-input';
import { authApi, getStoredUser, userApi } from '@/lib/api';
import { use, useEffect, useState, useRef } from 'react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [chatUser, setChatUser] = useState<any>({ name: 'User', photo: '/placeholder.svg' });
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = getStoredUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;

    const fetchMessages = () => {
      userApi.messages(id)
        .then((data) => {
          if (!active) return;
          setMessages(data.messages || []);
          setChatUser(data.chat?.otherUser || { id, name: 'User', photo: '/placeholder.svg' });
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Unable to load chat');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    authApi.heartbeat().catch(() => undefined);
    const interval = window.setInterval(() => {
      authApi.heartbeat().catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const handleSend = async (message: string) => {
    try {
      const data = await userApi.sendMessage(id, message);
      setMessages([
        ...messages,
        {
          ...data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading chat...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-64px)]">
      <ChatHeader user={chatUser} online={true} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <Container>
          {messages.length === 0 && (
            <p className="text-center text-zinc-500">No messages yet. Start the conversation.</p>
          )}
          {messages.map((msg) => {
            const isMine = Number(msg.senderId) === Number(currentUser?.id);
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-zinc-200 dark:bg-zinc-800 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </Container>
      </div>

      <ChatInput onSend={handleSend} />
    </div>
  );
}
