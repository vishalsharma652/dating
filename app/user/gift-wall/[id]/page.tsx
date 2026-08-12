'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Sparkles, Trophy, Search, MessageCircle, Send } from 'lucide-react';
import { userApi, apiAssetUrl } from '@/lib/api';
import Loading from '@/app/loading';

interface GiftWallPageProps {
  params: Promise<{ id: string }>;
}

export default function UserGiftWallPage({ params }: GiftWallPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    userApi.getPublicProfile(id)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load gift wall');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]">
      <Loading />
    </div>
  );

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 bg-[#070B18] min-h-screen flex items-center justify-center flex-col space-y-4">
        <p className="font-bold text-lg">{error}</p>
        <Link href="/user/discover" className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs">
          Back to Discover
        </Link>
      </div>
    );
  }

  const user = data?.user || {};
  const profile = data?.profile || {};
  const gifts: any[] = Array.isArray(data?.giftWall) ? data.giftWall : [];

  const rawPhoto = profile?.photos?.[0] || user.photo || '';
  const photoUrl = rawPhoto ? (apiAssetUrl(rawPhoto) || rawPhoto) : '/avatar-priya.jpg';
  const name = user.name || 'User';
  const displayUniqueId = String(user.unique_id || user.id || '').replace(/^STK-/i, '').padStart(6, '0');

  const filteredGifts = gifts.filter((g) =>
    String(g.giftName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGiftsCount = gifts.reduce((acc, g) => acc + (Number(g.qty) || 0), 0);
  const totalCoinsValue = gifts.reduce((acc, g) => acc + ((Number(g.coins) || 0) * (Number(g.qty) || 0)), 0);

  return (
    <div className="p-4 md:p-8 bg-[#070B18] text-white min-h-screen relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#EC4899]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none" />

      <Container className="max-w-5xl relative z-10 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0 cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={18} className="text-zinc-300" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={photoUrl}
                alt={name}
                className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 shadow-md"
              />
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{name}&apos;s Gift Wall</span>
                  <Trophy size={20} className="text-amber-400 fill-amber-400 animate-bounce" />
                </h1>
                <p className="text-xs font-semibold text-zinc-400">
                  ID: {displayUniqueId} • {totalGiftsCount} Gifts Received
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-amber-500 to-[#EC4899] hover:from-amber-400 hover:to-pink-500 text-white font-extrabold text-xs px-5 py-2.5 flex items-center justify-center gap-2 border-0 shadow-lg cursor-pointer"
              onClick={() => router.push(`/user/chat/${displayUniqueId || id}`)}
            >
              <Send size={14} />
              <span>Send Gift 🎁</span>
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#101827]/70 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400 shrink-0">
              🎁
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Total Received Gifts</p>
              <p className="text-2xl font-black text-white">{totalGiftsCount}</p>
            </div>
          </Card>

          <Card className="bg-[#101827]/70 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 shrink-0 font-black">
              🪙
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Total Coin Value</p>
              <p className="text-2xl font-black text-amber-300">{totalCoinsValue} Coins</p>
            </div>
          </Card>

          <Card className="bg-[#101827]/70 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xl text-purple-400 shrink-0">
              ✨
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Unique Gift Types</p>
              <p className="text-2xl font-black text-purple-300">{gifts.length}</p>
            </div>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        {gifts.length > 0 && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-amber-500/50 transition">
            <Search size={16} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search gifts by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Gifts Display Grid */}
        {filteredGifts.length === 0 ? (
          <Card className="p-12 text-center bg-[#101827]/50 backdrop-blur-xl border border-white/5 rounded-3xl space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-3xl">
              🎁
            </div>
            <h3 className="text-lg font-bold text-white">
              {searchQuery ? `No gifts match "${searchQuery}"` : 'No gifts received yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with another keyword.'
                : `${name} has not received any virtual gifts on their wall yet. Be the first to send a gift!`}
            </p>
            <Button
              className="mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#EC4899] text-white font-bold text-xs px-6 py-2.5 cursor-pointer shadow-md"
              onClick={() => router.push(`/user/chat/${displayUniqueId || id}`)}
            >
              Send {name} a Gift 🎁
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredGifts.map((item, idx) => {
              const price = Number(item.coins || 0);
              const qty = Number(item.qty || 0);
              const totalItemCoins = price * qty;

              return (
                <Card
                  key={idx}
                  className="relative p-5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-300 rounded-3xl text-center space-y-2 group shadow-lg"
                >
                  {/* Quantity Badge Top Right */}
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/40 text-xs font-black text-amber-300 shadow-md">
                    Qty: {qty}
                  </div>

                  {/* Gift Icon Emoji */}
                  <div className="text-5xl group-hover:scale-115 transition duration-300 transform py-2">
                    {item.giftIcon || '🎁'}
                  </div>

                  {/* Gift Name */}
                  <h4 className="text-sm font-black text-white truncate px-1">
                    {item.giftName || 'Gift'}
                  </h4>

                  {/* Price Tags */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="text-xs font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full shadow-sm">
                      🪙 {price} Coins / each
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">
                      Total Earned: 🪙 {totalItemCoins}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
