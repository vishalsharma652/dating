'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, Crown, Star, ShieldCheck, Gift, Trophy, Lock } from 'lucide-react';

export interface GiftItem {
  giftName: string;
  giftIcon: string;
  coins: number;
  qty: number;
  totalCoins?: number;
}

interface BadgesWallCardProps {
  user?: any;
  profile?: any;
  isVerified?: boolean;
}

export function BadgesWallCard({ user, profile, isVerified }: BadgesWallCardProps) {
  const isKyc = Boolean(user?.kyc_status === 'approved' || isVerified);
  const activeBadgesCount = 2 + (isKyc ? 1 : 0);

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#FBBF24] via-[#F59E0B] to-[#D97706] p-0.5 shadow-[0_12px_35px_rgba(245,158,11,0.3)] group transition-all duration-300">
      {/* Outer Card Shell with inner warm glow */}
      <div className="relative rounded-[26px] bg-gradient-to-b from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] p-4.5 pt-3 overflow-hidden">
        
        {/* Background Radiant Beams */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Badge Banner */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          {/* Centered Ribbon Title */}
          <div className="mx-auto flex items-center justify-center">
            <div className="relative px-6 py-1.5 rounded-full bg-gradient-to-r from-[#EA580C] via-[#DC2626] to-[#EA580C] border-2 border-amber-300/80 shadow-[0_4px_12px_rgba(220,38,38,0.4)] flex items-center gap-1.5 transform hover:scale-105 transition">
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-300" />
              <span className="text-[13px] font-black text-white uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Badges Wall
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-300" />
            </div>
          </div>

          {/* Right Counter */}
          <div className="absolute right-0 flex items-center text-amber-950/80 font-black text-xs">
            <span>{activeBadgesCount}</span>
            <ChevronRight size={14} className="stroke-[3]" />
          </div>
        </div>

        {/* Badges Podium Row */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10 pt-2 pb-1">
          {/* Badge 1: VIP 1 Ribbon Crown */}
          <div className="flex flex-col items-center group/badge cursor-pointer">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
              {/* Golden Podium Light */}
              <div className="absolute bottom-0 w-12 h-3 bg-amber-300/70 rounded-full blur-[3px]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative p-2 rounded-2xl bg-gradient-to-b from-amber-900/30 to-amber-950/40 backdrop-blur-sm border border-amber-300/60 shadow-lg group-hover/badge:scale-110 transition duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <Crown size={22} className="text-amber-950 fill-amber-900 drop-shadow" />
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-700 text-white text-[8px] font-black text-center tracking-tighter py-0.2 uppercase border-t border-emerald-400/50">
                      VIP 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge 2: Star Honor Badge */}
          <div className="flex flex-col items-center group/badge cursor-pointer">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
              <div className="absolute bottom-0 w-12 h-3 bg-amber-300/70 rounded-full blur-[3px]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative p-2 rounded-2xl bg-gradient-to-b from-purple-900/30 to-purple-950/40 backdrop-blur-sm border border-purple-300/60 shadow-lg group-hover/badge:scale-110 transition duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-600 flex items-center justify-center shadow-inner relative">
                    <Star size={22} className="text-amber-300 fill-amber-300 drop-shadow animate-pulse" />
                    <Sparkles size={10} className="text-white fill-white absolute top-1 right-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge 3: KYC Verified / Shield or Podium Slot */}
          <div className="flex flex-col items-center group/badge cursor-pointer">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
              <div className="absolute bottom-0 w-12 h-3 bg-amber-300/50 rounded-full blur-[3px]" />
              {isKyc ? (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative p-2 rounded-2xl bg-gradient-to-b from-emerald-900/30 to-emerald-950/40 backdrop-blur-sm border border-emerald-300/60 shadow-lg group-hover/badge:scale-110 transition duration-300">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 flex items-center justify-center shadow-inner">
                      <ShieldCheck size={22} className="text-white drop-shadow" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-600/30 border border-amber-300/30 backdrop-blur-sm flex items-center justify-center text-amber-900/40 group-hover/badge:bg-amber-600/40 transition">
                  <Lock size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Badge 4: Empty Podium Slot */}
          <div className="flex flex-col items-center group/badge">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
              <div className="absolute bottom-0 w-12 h-3 bg-amber-300/40 rounded-full blur-[3px]" />
              <div className="w-14 h-14 rounded-2xl bg-amber-600/25 border border-amber-300/20 backdrop-blur-sm flex items-center justify-center text-amber-900/30">
                <Sparkles size={15} />
              </div>
            </div>
          </div>
        </div>

        {/* Podium Base Line Beam */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent rounded-full mt-1 opacity-70" />
      </div>
    </div>
  );
}

interface GiftsHonorWallCardProps {
  userId?: string | number;
  gifts?: GiftItem[];
  onOpenWall?: () => void;
  maxDisplay?: number;
}

export function GiftsHonorWallCard({
  userId,
  gifts = [],
  onOpenWall,
  maxDisplay = 4
}: GiftsHonorWallCardProps) {
  const router = useRouter();

  const totalGiftsCount = gifts.reduce((acc, g) => acc + (Number(g.qty) || 0), 0);
  const displayedGifts = gifts.slice(0, maxDisplay);

  const handleOpenGiftWall = () => {
    if (onOpenWall) {
      onOpenWall();
      return;
    }
    if (userId) {
      router.push(`/user/gift-wall/${userId}`);
    } else {
      router.push('/user/gift-wall');
    }
  };

  return (
    <div
      onClick={handleOpenGiftWall}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#F43F5E] via-[#EC4899] to-[#D946EF] p-0.5 shadow-[0_12px_35px_rgba(236,72,153,0.35)] group transition-all duration-300 cursor-pointer"
    >
      {/* Outer Card Shell with Vibrant Pink Texture */}
      <div className="relative rounded-[26px] bg-gradient-to-b from-[#FDA4AF] via-[#F472B6] to-[#E879F9] p-4.5 pt-3 overflow-hidden">
        
        {/* Background Sparkles & Glow Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />
        
        {/* Subtle Diamond Grid Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        {/* Top Header Badge Banner */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          {/* Centered Ribbon Title */}
          <div className="mx-auto flex items-center justify-center">
            <div className="relative px-6 py-1.5 rounded-full bg-gradient-to-r from-[#BE185D] via-[#9D174D] to-[#BE185D] border-2 border-pink-200/90 shadow-[0_4px_12px_rgba(157,23,77,0.4)] flex items-center gap-1.5 transform group-hover:scale-105 transition">
              <span className="w-1.5 h-1.5 rotate-45 bg-pink-200" />
              <span className="text-[13px] font-black text-white uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center gap-1">
                <span>Gifts Honor Wall</span>
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-pink-200" />
            </div>
          </div>

          {/* Right Counter */}
          <div className="absolute right-0 flex items-center text-pink-950/80 font-black text-xs group-hover:translate-x-0.5 transition">
            <span>{totalGiftsCount}</span>
            <ChevronRight size={14} className="stroke-[3]" />
          </div>
        </div>

        {/* Gifts Display Row */}
        {gifts.length === 0 ? (
          <div className="py-5 px-3 text-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 space-y-1 relative z-10 my-1">
            <div className="text-2xl animate-bounce">🎁</div>
            <p className="text-xs font-black text-pink-950">No Gifts Received Yet</p>
            <p className="text-[10px] font-semibold text-pink-900/80">
              Gifts shared in chats will automatically appear here on the Honor Wall!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10 pt-2 pb-1">
            {displayedGifts.map((gift, idx) => {
              const qty = Number(gift.qty || 0);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center group/item transition-transform duration-300 group-hover:translate-y-[-2px]"
                >
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
                    {/* Glowing Platform */}
                    <div className="absolute bottom-0 w-12 h-3 bg-pink-300/80 rounded-full blur-[3px]" />

                    {/* Gift Bubble */}
                    <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-white/40 to-white/10 backdrop-blur-md border border-white/60 shadow-[0_4px_15px_rgba(190,24,93,0.3)] flex items-center justify-center group-hover/item:scale-110 transition duration-300">
                      
                      {/* Quantity Tag Top-Right */}
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#BE185D] to-[#9D174D] border border-white text-[9px] font-black text-white shadow-md">
                        x{qty}
                      </span>

                      {/* Gift Icon Emoji */}
                      <span className="text-2xl sm:text-3xl drop-shadow-md transform group-hover/item:rotate-6 transition">
                        {gift.giftIcon || '🎁'}
                      </span>
                    </div>
                  </div>

                  {/* Gift Label */}
                  <span className="text-[10px] font-black text-pink-950 truncate max-w-full text-center px-0.5 mt-1 drop-shadow-sm">
                    {gift.giftName || 'Gift'}
                  </span>
                </div>
              );
            })}

            {/* If fewer than 4 gifts, fill remaining slots with glowing gift placeholders */}
            {displayedGifts.length < 4 &&
              Array.from({ length: 4 - displayedGifts.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center opacity-60">
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center text-pink-950/40">
                      <Gift size={18} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-950/50 mt-1">Reward</span>
                </div>
              ))}
          </div>
        )}

        {/* Podium Base Line Beam */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-pink-100 to-transparent rounded-full mt-1 opacity-75" />
      </div>
    </div>
  );
}

interface HonorWallProps {
  userId?: string | number;
  user?: any;
  profile?: any;
  gifts?: GiftItem[];
  isVerified?: boolean;
  onOpenWall?: () => void;
}

export function HonorWall({
  userId,
  user,
  profile,
  gifts = [],
  isVerified,
  onOpenWall
}: HonorWallProps) {
  return (
    <div className="space-y-4">
      {/* 1. Badges Wall Card */}
      <BadgesWallCard user={user} profile={profile} isVerified={isVerified} />

      {/* 2. Gifts Honor Wall Card */}
      <GiftsHonorWallCard
        userId={userId}
        gifts={gifts}
        onOpenWall={onOpenWall}
        maxDisplay={4}
      />
    </div>
  );
}
