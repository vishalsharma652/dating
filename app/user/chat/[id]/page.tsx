'use client';

import { Container } from '@/components/ui/container';
import { ChatHeader } from '@/components/user/chat-header';
import { ChatInput } from '@/components/user/chat-input';
import { authApi, getStoredUser, userApi, apiAssetUrl } from '@/lib/api';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useCall } from '@/components/user/call-provider';
import Link from 'next/link';
import { Check, CheckCheck, Clock, Sparkles, Trash2 } from 'lucide-react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>({ name: 'User', photo: '/placeholder.svg', online: false });
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [chatBlocked, setChatBlocked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [deleteModalMsg, setDeleteModalMsg] = useState<any>(null);
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
          const storedUser = getStoredUser();
          const isBoyUser = String(storedUser?.gender || '').toLowerCase() === 'male';
          const defaultAvatar = isBoyUser ? '/female-logo.svg' : '/male-logo.svg';
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
  const handleSend = async (message: string, type: 'text' | 'image' | 'gift' | 'say_hi' = 'text') => {
    setSendError('');
    try {
      const data = await userApi.sendMessage(id, message, type);
      const msgData = await userApi.messages(id);
      setMessages(msgData.messages || []);

      if (data.remainingCoins !== undefined && data.remainingCoins !== null) {
        setWalletBalance(Number(data.remainingCoins));
      }
      if (data.rechargeExhausted || (isBoy && data.remainingCoins !== null && Number(data.remainingCoins) < 5)) {
        setChatBlocked(true);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:wallet-updated', { detail: {} }));
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      const errMsg = err?.message || 'Failed to send message';
      if (errMsg.toLowerCase().includes('recharge') || errMsg.toLowerCase().includes('coin') || errMsg.toLowerCase().includes('deliver')) {
        setSendError('Recharge khatam ho gaya. Message deliver nahi hua.');
      } else {
        setSendError(errMsg);
      }
    }
  };

  const handleDeleteMessage = async (type: 'me' | 'everyone') => {
    if (!deleteModalMsg) return;
    const targetId = Number(deleteModalMsg.id);
    try {
      await userApi.deleteMessage(targetId, type);
      if (type === 'me') {
        setMessages((prev) => prev.filter((m) => Number(m.id) !== targetId));
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            Number(m.id) === targetId
              ? { ...m, text: '🚫 This message was deleted', deletedForEveryone: true }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error('Delete error', err);
    } finally {
      setDeleteModalMsg(null);
    }
  };

  // ── Call handlers ─────────────────────────────────────────────────
  const startVoiceCall = useCallback(() => call.initiateCall(id, 'voice', chatUser.name, chatUser.photo), [call, id, chatUser]);
  const startVideoCall = useCallback(() => call.initiateCall(id, 'video', chatUser.name, chatUser.photo), [call, id, chatUser]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading chat...</div>;
  if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <>
      {/* ── Main Chat UI with ID in URL (/user/chat/[id]) ── */}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0F19] bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]">
          <Container>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center my-6 p-6 space-y-4 bg-white/[0.02] border border-white/10 rounded-3xl text-center shadow-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#7C3AED] flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-base">Say Hi 👋 to {chatUser?.name || 'User'}</h3>
                  <p className="text-zinc-400 text-xs">
                    Choose one of the 5 auto-generated icebreaker questions below:
                    {isBoy && <span className="block text-amber-400 font-extrabold mt-1">✨ Only 5 Coins for Say Hi</span>}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 w-full max-w-md pt-2">
                  {[
                    'Hey! How is your day going? 😊',
                    'Hi there! Would you like to connect and chat? ✨',
                    'Hello! You have a lovely profile 😊',
                    'Hi! What are your favorite hobbies? 🌟',
                    'Hey! Coffee or tea person? ☕',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q, 'say_hi')}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#EC4899] hover:bg-[#EC4899]/10 text-white text-xs font-semibold text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <span className="pr-2">{q}</span>
                      <span className="text-[10px] bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white px-2.5 py-1 rounded-full font-extrabold flex-shrink-0">
                        {isBoy ? '5 Coins' : 'Free'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.type === 'system' || String(msg.text || msg.body || '').includes('Recharge khatam ho gaya')) {
                const messageText = msg.text || msg.body || '';
                const isRecharge = messageText.includes('Recharge khatam ho gaya');
                const isMutualFriend = messageText.includes('Friends') || messageText.includes('FREE');
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg max-w-md text-center ${
                      isMutualFriend
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : isRecharge
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        : 'bg-pink-500/15 border border-pink-500/30 text-pink-300'
                    }`}>
                      <span>{messageText || (isRecharge ? '⚠️ Recharge khatam ho gaya' : '')}</span>
                      {isRecharge && isBoy && (
                        <Link
                          href="/user/wallet/coins"
                          className="ml-2 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition shadow-md whitespace-nowrap"
                        >
                          Buy Coins 🪙
                        </Link>
                      )}
                    </div>
                  </div>
                );
              }

              const isMine = Number(msg.senderId) === Number(currentUser?.id);
              const isDeleted = msg.text === '🚫 This message was deleted' || msg.deletedForEveryone;

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} my-1 group/msg relative`}>
                  <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-md">
                    {isMine && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => setDeleteModalMsg(msg)}
                        title="Delete Message"
                        className="flex-shrink-0 p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <div
                      className={`w-fit px-3 py-1.5 rounded-xl text-sm leading-normal shadow-sm relative ${
                        isDeleted
                          ? 'bg-zinc-800/80 text-zinc-400 italic border border-white/5'
                          : isMine
                          ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white rounded-tr-none'
                          : 'bg-[#1E293B] text-zinc-100 rounded-tl-none border border-white/5'
                      }`}
                    >
                      {msg.type === 'image' && !isDeleted ? (
                        String(msg.text || '').match(/\.(mp4|webm|mov|avi|mkv|3gp)($|\?)/i) ? (
                          <video src={msg.text} controls className="max-w-[240px] max-h-[240px] rounded-lg my-1 border border-white/10" />
                        ) : (
                          <img src={msg.text} alt="Photo attachment" className="max-w-[220px] max-h-[220px] object-cover rounded-lg my-1 border border-white/10" />
                        )
                      ) : (
                        <span className="break-words font-normal">{msg.text}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] opacity-75 whitespace-nowrap ml-2.5 float-right translate-y-[2px]">
                        <span>{msg.timestamp}</span>
                        {isMine && !isDeleted && (
                          msg.deliveryStatus === 'read' ? (
                            <CheckCheck size={13} className="text-sky-300 inline" />
                          ) : msg.deliveryStatus === 'undelivered' ? (
                            <Clock size={12} className="text-amber-400/80 inline" />
                          ) : chatUser?.online ? (
                            <CheckCheck size={13} className="text-zinc-300 inline" />
                          ) : (
                            <Check size={13} className="text-zinc-400 inline" />
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {sendError && (
              <div className="my-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
                <p className="flex-1 font-bold">{sendError}</p>
                {(sendError.toLowerCase().includes('coin') || sendError.toLowerCase().includes('recharge')) && (
                  <Link
                    href="/user/wallet/coins"
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs whitespace-nowrap shadow-md"
                  >
                    Buy Coins 🪙
                  </Link>
                )}
              </div>
            )}
            {isBoy && walletBalance !== null && walletBalance < 5 && !sendError && (
              <div className="my-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg">
                <p className="flex-1 font-bold">⚠️ Recharge khatam ho gaya. Send message karne ke liye coins buy karein.</p>
                <Link
                  href="/user/wallet/coins"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs whitespace-nowrap shadow-md"
                >
                  Buy Coins 🪙
                </Link>
              </div>
            )}

            <div ref={messagesEndRef} />
          </Container>
        </div>

        {/* Bottom Input Bar */}
        <ChatInput onSend={handleSend} />
      </div>

      {/* Delete Message Modal */}
      {deleteModalMsg && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModalMsg(null)}>
          <div
            className="w-full sm:w-80 bg-[#0F172A] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-base">Delete Message?</h3>
              <p className="text-zinc-400 text-xs mt-1">Choose how you want to delete this message</p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => handleDeleteMessage('me')}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition cursor-pointer flex items-center gap-3"
              >
                <Trash2 size={16} className="text-zinc-400" />
                Delete for Me
              </button>
              <button
                onClick={() => handleDeleteMessage('everyone')}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition cursor-pointer flex items-center gap-3"
              >
                <Trash2 size={16} className="text-red-400" />
                Delete for Everyone
              </button>
              <button
                onClick={() => setDeleteModalMsg(null)}
                className="w-full py-3 px-4 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 text-sm transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
