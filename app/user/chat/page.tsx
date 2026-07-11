'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { userApi } from '@/lib/api';

export default function ChatListPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadChats = () => {
      userApi.chats()
        .then((data) => {
          if (!active) return;
          setChats(data.chats || []);
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

  const filteredChats = useMemo(
    () => chats.filter((chat) => String(chat.name || '').toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading conversations...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </p>

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-3 text-zinc-400" size={20} />
          <Input
            placeholder="Search conversations..."
            className="pl-12"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredChats.length === 0 && (
            <Card className="p-8 text-center text-zinc-500">No conversations found.</Card>
          )}
          {filteredChats.map((chat) => (
            <Link key={chat.id} href={`/user/chat/${chat.userId}`}>
              <Card className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <Avatar src={chat.photo || '/placeholder.svg'} alt={chat.name} fallback={chat.name?.[0] || 'U'} />
                      {Boolean(chat.online) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-950" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{chat.name}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">{chat.lastMessageTime}</p>
                    {Number(chat.unread) > 0 && (
                      <Badge className="bg-pink-500 text-white">{Number(chat.unread) > 99 ? '99+' : chat.unread}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
