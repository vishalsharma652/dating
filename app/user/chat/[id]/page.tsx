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
import { Check, CheckCheck, Clock, Trash2, X } from 'lucide-react';

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

  const [digitError, setDigitError] = useState('');

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = async (message: string, type: 'text' | 'image' | 'gift' | 'say_hi' = 'text') => {
    setDigitError('');
    if (type === 'text' && /\d/.test(message)) {
      setDigitError('Sharing numbers or digits in chat is strictly prohibited 🚫');
      setTimeout(() => setDigitError(''), 4000);
      return;
    }

    try {
      const data = await userApi.sendMessage(id, message, type);
      setMessages((prev) => [
        ...prev,
        {
          ...data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      // Instantly refresh wallet balance to reflect deducted coins or exhaustion
      userApi.wallet().then((w) => setWalletBalance(Number(w.coins))).catch(() => undefined);
    } catch (err: any) {
      console.error('Send message error:', err);
      const errMsg = err?.message || 'Failed to send message';
      if (errMsg.toLowerCase().includes('digit') || errMsg.toLowerCase().includes('number')) {
        setDigitError('Sharing numbers or digits in chat is strictly prohibited 🚫');
        setTimeout(() => setDigitError(''), 4000);
      }
    }
  };

  const [selectedMsgForDelete, setSelectedMsgForDelete] = useState<any>(null);

  const handleDeleteMessage = async (mode: 'me' | 'everyone') => {
    if (!selectedMsgForDelete) return;
    const msgId = selectedMsgForDelete.id;
    try {
      await userApi.deleteMessage(msgId, mode);
      if (mode === 'everyone') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, text: '🚫 This message was deleted', deletedForEveryone: true } : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (err: any) {
      console.error('Delete message error:', err);
    } finally {
      setSelectedMsgForDelete(null);
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
              const isDeleted = Boolean(msg.deletedForEveryone) || msg.text === '🚫 This message was deleted';
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} my-1 group relative`}>
                  <div className="relative flex items-center gap-1.5 max-w-[85%] sm:max-w-md">
                    {/* Delete Icon Trigger Button */}
                    {!isDeleted && (
                      <button
                        type="button"
                        onClick={() => setSelectedMsgForDelete(msg)}
                        className={`opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 transition rounded-full hover:bg-white/10 shrink-0 cursor-pointer ${
                          isMine ? 'order-first' : 'order-last'
                        }`}
                        title="Delete message"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <div
                      className={`w-fit px-3 py-1.5 rounded-xl text-sm leading-normal shadow-sm ${
                        isDeleted
                          ? 'bg-zinc-800/60 text-zinc-400 italic border border-white/5'
                          : isMine
                          ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white rounded-tr-none'
                          : 'bg-[#1E293B] text-zinc-100 rounded-tl-none border border-white/5'
                      }`}
                    >
                      {isDeleted ? (
                        <span className="text-xs italic text-zinc-400">🚫 This message was deleted</span>
                      ) : msg.type === 'image' ? (
                        <img src={msg.text} alt="Photo attachment" className="max-w-[220px] max-h-[220px] object-cover rounded-lg my-1 border border-white/10" />
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
            <div ref={messagesEndRef} />
          </Container>
        </div>

        {/* Low Coins Warning Banner for Male users */}
        {isBoy && walletBalance !== null && walletBalance < 10 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-t border-b border-amber-500/30 px-4 py-2 flex items-center justify-between z-30">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <Clock size={15} className="text-amber-400 shrink-0 animate-pulse" />
              <span>
                {walletBalance === 0
                  ? 'Recharge exhausted (0 Coins). Messages will not be delivered.'
                  : `Low coins (${walletBalance} left). Minimum 10 coins needed per message.`}
              </span>
            </div>
            <Link
              href="/user/wallet/coins"
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-full shadow-md transition shrink-0"
            >
              Recharge Now
            </Link>
          </div>
        )}

        {/* Digit Sharing Restriction Warning Banner */}
        {digitError && (
          <div className="bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white border-t border-b border-red-500/50 px-4 py-2 flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>🚫</span>
              <span>{digitError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDigitError('')}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bottom bar */}
        <ChatInput onSend={handleSend} />
      </div>

      {/* Delete Message Confirmation Modal */}
      {selectedMsgForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0D1424] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <h3 className="text-base font-bold text-white">Delete Message?</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMsgForDelete(null)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-300">Choose how you want to delete this message:</p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteMessage('me')}
                className="w-full text-left p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>Delete for me (From my side)</span>
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">Me Only</span>
              </button>

              {Number(selectedMsgForDelete.senderId) === Number(currentUser?.id) && (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage('everyone')}
                  className="w-full text-left p-3 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>🚫</span>
                    <span>Delete for everyone (Both sides)</span>
                  </span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-md">Both Sides</span>
                </button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedMsgForDelete(null)}
              className="w-full rounded-2xl border-white/15 text-xs text-zinc-300 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
