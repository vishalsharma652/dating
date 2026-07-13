'use client';

import { Container } from '@/components/ui/container';
import { ChatHeader } from '@/components/user/chat-header';
import { ChatInput } from '@/components/user/chat-input';
import { VoiceCallModal } from '@/components/user/voice-call-modal';
import { VideoCallModal } from '@/components/user/video-call-modal';
import { authApi, getStoredUser, userApi } from '@/lib/api';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useCall } from '@/components/user/call-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ActiveCall = 'voice' | 'video' | null;

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [chatUser, setChatUser] = useState<any>({ name: 'User', photo: '/placeholder.svg', online: false });
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatBlocked, setChatBlocked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const call = useCall();

  const currentUser = getStoredUser();
  const currentUserGender = String(currentUser?.gender || '').toLowerCase();
  const isBoy = currentUserGender === 'male';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Poll messages ────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const fetchMessages = () => {
      userApi.messages(id)
        .then((data) => {
          if (!active) return;
          setMessages(data.messages || []);
          setChatUser(data.chat?.otherUser || { id, name: 'User', photo: '/placeholder.svg', online: false });
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
    return () => { active = false; clearInterval(interval); };
  }, [id]);

  // ── Session + wallet ─────────────────────────────────────────────
  useEffect(() => {
    let sessionId: number | string | null = null;
    let active = true;

    const startSession = async () => {
      try {
        const data = await userApi.startChatSession(id);
        if (!active) return;
        sessionId = data.session.id;
        setChatBlocked(false);
      } catch {
        if (active) setChatBlocked(true);
      }
    };

    const refreshWallet = () =>
      userApi.wallet().then((data) => {
        if (!active) return;
        setWalletBalance(Number(data.coins));
        if (isBoy && Number(data.coins) < 10) setChatBlocked(true);
      }).catch(() => undefined);

    startSession();
    refreshWallet();
    const interval = window.setInterval(refreshWallet, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
      if (sessionId) userApi.endChatSession(sessionId).catch(() => undefined);
    };
  }, [id, isBoy]);

  // ── Heartbeat ────────────────────────────────────────────────────
  useEffect(() => {
    authApi.heartbeat().catch(() => undefined);
    const interval = window.setInterval(() => authApi.heartbeat().catch(() => undefined), 30000);
    return () => window.clearInterval(interval);
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = async (message: string) => {
    if (chatBlocked) return;
    try {
      const data = await userApi.sendMessage(id, message);
      setMessages((prev) => [
        ...prev,
        {
          ...data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      const txt = err instanceof Error ? err.message : 'Unable to send message';
      setError(txt);
      if (txt.toLowerCase().includes('coin') || txt.toLowerCase().includes('blocked')) setChatBlocked(true);
    }
  };

  // ── Call handlers ─────────────────────────────────────────────────
  const startVoiceCall = useCallback(() => call.initiateCall(id, 'voice', chatUser.name, chatUser.photo), [call, id, chatUser]);
  const startVideoCall = useCallback(() => call.initiateCall(id, 'video', chatUser.name, chatUser.photo), [call, id, chatUser]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading chat...</div>;
  if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      {/* ── Main Chat UI ───────────────────────────────── */}
      <div className="flex flex-col h-screen md:h-[calc(100vh-64px)]">
        <ChatHeader
          user={chatUser}
          online={Boolean(chatUser?.online)}
          onVoiceCall={startVoiceCall}
          onVideoCall={startVideoCall}
          coinBalance={walletBalance}
          isBoy={isBoy}
        />

        {/* Messages area */}
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

        {/* Bottom bar */}
        {chatBlocked ? (
          <div className="border-t border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Chat paused — at least 10 coins are needed for the next minute.
            </p>
            {walletBalance !== null && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your balance: {walletBalance} coins
              </p>
            )}
            <Button asChild className="mt-3">
              <Link href="/user/wallet/coins">Buy Coins</Link>
            </Button>
          </div>
        ) : (
          <ChatInput onSend={handleSend} />
        )}
      </div>
    </>
  );
}
