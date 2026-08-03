'use client';

import { Container } from '@/components/ui/container';
import { ChatHeader } from '@/components/user/chat-header';
import { ChatInput } from '@/components/user/chat-input';
import { VoiceCallModal } from '@/components/user/voice-call-modal';
import { VideoCallModal } from '@/components/user/video-call-modal';
import { authApi, getStoredUser, userApi, apiAssetUrl } from '@/lib/api';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useCall } from '@/components/user/call-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck } from 'lucide-react';

type ActiveCall = 'voice' | 'video' | null;

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>({ name: 'User', photo: '/placeholder.svg', online: false });
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatBlocked, setChatBlocked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const call = useCall();

  const isBoy = String(currentUser?.gender || '').toLowerCase() === 'male';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

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
          const otherUser = data.chat?.otherUser || { id, name: 'User', photo: '', online: false };
          // Gender-based default avatar: boy sees girl photo, girl sees boy photo
          const storedUser = getStoredUser();
          const isBoyUser = String(storedUser?.gender || '').toLowerCase() === 'male';
          const defaultAvatar = isBoyUser ? '/avatar-priya.jpg' : '/avatar-boy1.jpg';
          const resolvedPhoto = otherUser.photo && otherUser.photo.trim()
            ? (apiAssetUrl(otherUser.photo) || otherUser.photo)
            : defaultAvatar;
          setChatUser({ ...otherUser, photo: resolvedPhoto });
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
      {/* ── Main Chat UI ── Fixed full screen on mobile, static flex on desktop ── */}
      <div className="fixed inset-0 md:static md:h-[calc(100vh-64px)] z-40 bg-[#070B18] flex flex-col">
        <ChatHeader
          user={chatUser}
          online={Boolean(chatUser?.online)}
          onVoiceCall={startVoiceCall}
          onVideoCall={startVideoCall}
          coinBalance={walletBalance}
          isBoy={isBoy}
        />

        {/* Messages area — WhatsApp style wallpaper background */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-1 bg-[#070B18] bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]">
          <Container>
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-medium">
                No messages yet. Say hi to start chatting! 👋
              </div>
            )}
            {messages.map((msg) => {
              const isMine = Number(msg.senderId) === Number(currentUser?.id);
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} my-0.5`}>
                  <div
                    className={`w-fit max-w-[85%] sm:max-w-md px-3 py-1.5 rounded-xl text-sm leading-normal shadow-sm ${
                      isMine
                        ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white rounded-tr-none'
                        : 'bg-[#1E293B] text-zinc-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <span className="break-words font-normal">{msg.text}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] opacity-75 whitespace-nowrap ml-2.5 float-right translate-y-[2px]">
                      <span>{msg.timestamp}</span>
                      {isMine && (
                        msg.deliveryStatus === 'read' ? (
                          <CheckCheck size={13} className="text-sky-300 inline" />
                        ) : chatUser?.online ? (
                          <CheckCheck size={13} className="text-zinc-300 inline" />
                        ) : (
                          <Check size={13} className="text-zinc-400 inline" />
                        )
                      )}
                    </span>
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
