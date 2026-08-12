'use client';

import { useRouter } from 'next/navigation';
import { Gift, Sparkles, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface GiftItem {
  giftName: string;
  giftIcon: string;
  coins: number;
  qty: number;
  totalCoins?: number;
}

interface GiftWallProps {
  userId?: string | number;
  gifts?: GiftItem[];
  title?: string;
  showSendGiftBtn?: boolean;
  onSendGiftClick?: () => void;
  maxDisplay?: number;
}

export function GiftWall({
  userId,
  gifts = [],
  title = 'Gift Wall 🎁',
  showSendGiftBtn = false,
  onSendGiftClick,
  maxDisplay = 4
}: GiftWallProps) {
  const router = useRouter();

  const totalGiftsCount = gifts.reduce((acc, g) => acc + (Number(g.qty) || 0), 0);
  const totalCoinsValue = gifts.reduce((acc, g) => acc + ((Number(g.coins) || 0) * (Number(g.qty) || 0)), 0);

  const displayedGifts = gifts.slice(0, maxDisplay);

  const handleOpenGiftWallPage = () => {
    if (userId) {
      router.push(`/user/gift-wall/${userId}`);
    } else {
      router.push('/user/gift-wall');
    }
  };

  return (
    <Card className="bg-[#101827]/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-4.5 sm:p-5 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group transition-all duration-300">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-[#EC4899]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition group/header"
          onClick={handleOpenGiftWallPage}
          title="Click to open full Gift Wall Page"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover/header:bg-amber-500/25 transition">
            <Gift size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-white tracking-tight text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>{title}</span>
              <Sparkles size={12} className="text-amber-400 fill-amber-400" />
              <ExternalLink size={11} className="text-amber-400/80 group-hover/header:translate-x-0.5 transition" />
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold">
              {totalGiftsCount > 0 ? `${totalGiftsCount} Gifts Received` : 'Virtual Gifts Received'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCoinsValue > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <span>🪙 {totalCoinsValue} Coins</span>
            </span>
          )}
          {showSendGiftBtn && (
            <button
              type="button"
              onClick={onSendGiftClick}
              className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-[#EC4899] text-white hover:opacity-90 transition cursor-pointer shadow-md"
            >
              + Send Gift
            </button>
          )}
        </div>
      </div>

      {/* Gifts Grid */}
      {gifts.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-xl">
            🎁
          </div>
          <p className="text-xs font-bold text-zinc-300">No gifts received yet</p>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
            Gifts received in chat will automatically appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {displayedGifts.map((item, idx) => {
              const price = Number(item.coins || 0);
              const qty = Number(item.qty || 0);
              return (
                <div
                  key={idx}
                  onClick={handleOpenGiftWallPage}
                  className="relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 transition duration-300 text-center space-y-1 group/item shadow-sm cursor-pointer"
                >
                  {/* Quantity Badge Top Right */}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/40 text-[9px] font-black text-amber-300 shadow-sm">
                    x{qty}
                  </div>

                  {/* Gift Emoji Icon */}
                  <div className="text-2xl group-hover/item:scale-110 transition duration-200 transform py-0.5">
                    {item.giftIcon || '🎁'}
                  </div>

                  {/* Gift Name */}
                  <span className="text-[11px] font-bold text-zinc-200 truncate w-full px-1">
                    {item.giftName || 'Gift'}
                  </span>

                  {/* Price Label */}
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    🪙 {price}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dedicated Page Navigation Button */}
          <button
            type="button"
            onClick={handleOpenGiftWallPage}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
          >
            <span>Open Gift Wall Page 🎁</span>
            <ExternalLink size={13} className="text-amber-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      )}
    </Card>
  );
}
