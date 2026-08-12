'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Pin, PinOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { userApi, getStoredUser, apiAssetUrl } from '@/lib/api';
import Loading from '@/app/loading';

export default function ChatListPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBoy = String(currentUser?.gender || '').toLowerCase() === 'male';

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  useEffect(() => {
    let active = true;

    const loadChats = () => {
      userApi.chats()
        .then((data) => {
          if (!active) return;
          const loadedChats = data.chats || [];
          setChats(loadedChats.sort((a: any, b: any) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))));
          setError('');
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Unable to load conversations');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadChats();
    const interval = window.setInterval(loadChats, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handlePinToggle = async (e: React.MouseEvent, chatId: number | string) => {
    e.preventDefault();
    e.stopPropagation();

    // Immediate Optimistic Update
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, isPinned: !c.isPinned } : c
      );
      return updated.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
    });

    try {
      const res = await userApi.togglePinChat(chatId);
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, isPinned: res.pinned } : c
        );
        return updated.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
      });
    } catch (err: any) {
      console.error('Pin error:', err);
    }
  };

  const filteredChats = useMemo(
    () => chats.filter((chat) => String(chat.name || '').toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="space-y-3">
        <Loading />
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Chat History</h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {chats.length} active conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-3 text-zinc-400" size={20} />
          <Input
            placeholder="Search chat history..."
            className="pl-12"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredChats.length === 0 && (
            <Card className="p-8 text-center text-zinc-500">
              No chat history found. Start a conversation with a match!
            </Card>
          )}
          {filteredChats.map((chat) => {
            const defaultAvatar = isBoy ? '/female-logo.svg' : '/male-logo.svg';
            const photoVal = chat.photo && chat.photo.trim() && chat.photo !== '/placeholder.svg'
              ? (apiAssetUrl(chat.photo) || chat.photo)
              : defaultAvatar;
            const isPinned = Boolean(chat.isPinned);
            const chatSlug = chat.uniqueId || String(chat.userId || '').padStart(6, '0');

            return (
              <Link key={chat.id} href={`/user/chat/${chatSlug}`}>
                <Card className={`p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer relative ${
                  isPinned ? 'border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.04]' : ''
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar src={photoVal} alt={chat.name} fallback={chat.name?.[0] || 'U'} />
                        {Boolean(chat.online) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-950" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                          {isPinned && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                              <Pin size={10} className="fill-amber-400 text-amber-400" /> Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-1">{chat.lastMessageTime}</p>
                        {Number(chat.unread) > 0 && (
                          <Badge className="bg-pink-500 text-white">{Number(chat.unread) > 99 ? '99+' : chat.unread}</Badge>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePinToggle(e, chat.id)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isPinned
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30'
                            : 'hover:bg-white/10 text-zinc-400 hover:text-amber-400'
                        }`}
                        title={isPinned ? 'Unpin chat' : 'Pin chat to top'}
                      >
                        {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
