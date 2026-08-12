'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  Heart,
  Sparkles,
  CheckCircle2,
  User,
  Phone,
  Video,
  UserPlus,
  UserCheck,
  Users,
  Clock,
  MessageCircle,
  Gift,
  ExternalLink,
  ChevronLeft,
  Share2,
  MoreHorizontal,
  Flame,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { userApi, authApi, apiAssetUrl } from '@/lib/api';
import { FollowersModal } from '@/components/user/followers-modal';
import { SayHiModal } from '@/components/user/say-hi-modal';
import { BadgesWallCard, GiftsHonorWallCard } from '@/components/user/honor-wall';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | number;
  initialUser?: any;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  userId,
  initialUser,
  onVoiceCall,
  onVideoCall,
}: UserProfileModalProps) {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'honor' | 'moment' | 'relationships'>('profile');
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [hasExistingChat, setHasExistingChat] = useState<boolean>(false);
  const [sayHiTarget, setSayHiTarget] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    authApi.me().then((res: any) => setCurrentUser(res?.user)).catch(() => null);
  }, []);

  useEffect(() => {
    if (!isOpen || !(userId || initialUser?.id)) return;
    const targetId = userId || initialUser?.id;
    setLoading(true);

    userApi.getPublicProfile(targetId)
      .then((res) => {
        setProfileData(res);
        setFollowStatus(res.status || (res.following ? 'accepted' : 'none'));
        setFollowerCount(Number(res.followerCount || 0));
      })
      .catch(() => {
        setProfileData(null);
      })
      .finally(() => setLoading(false));

    userApi.chats()
      .then((res) => {
        const ids = new Set<number>(
          (res.chats || []).map((c: any) => Number(c.userId || c.user_id || c.id))
        );
        setHasExistingChat(ids.has(Number(targetId)));
      })
      .catch(() => setHasExistingChat(false));

    userApi.dashboard()
      .then((dash) => {
        if (dash?.user?.coins !== undefined) {
          setUserCoins(dash.user.coins);
        }
      })
      .catch(() => undefined);

    const handleGlobalFollowUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && Number(detail.targetUserId) === Number(targetId)) {
        if (detail.status !== undefined) setFollowStatus(detail.status);
        if (detail.followerCount !== undefined) setFollowerCount(detail.followerCount);
      }
    };

    window.addEventListener('follow:updated', handleGlobalFollowUpdate);
    return () => {
      window.removeEventListener('follow:updated', handleGlobalFollowUpdate);
    };
  }, [isOpen, userId, initialUser]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isSelf = Boolean(
    currentUser?.id &&
    (Number(userId || initialUser?.id) === Number(currentUser.id) || String(userId || initialUser?.id) === String(currentUser.unique_id))
  );

  const handleFollowToggle = async () => {
    const targetId = userId || initialUser?.id;
    if (!targetId || followLoading || isSelf) return;
    setFollowLoading(true);

    const prevStatus = followStatus;
    const prevCount = followerCount;
    const nextStatus = prevStatus === 'none' ? 'pending' : 'none';
    const nextCount = prevStatus === 'accepted' ? Math.max(0, prevCount - 1) : prevCount;

    // Immediate Optimistic Update
    setFollowStatus(nextStatus);
    setFollowerCount(nextCount);

    try {
      const res = await userApi.toggleFollow(targetId);
      setFollowStatus(res.status);
      setFollowerCount(res.followerCount);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('follow:updated', { detail: { targetUserId: targetId, status: res.status, followerCount: res.followerCount } }));
      }
    } catch (err: any) {
      console.error('Follow error:', err);
      // Rollback on error
      setFollowStatus(prevStatus);
      setFollowerCount(prevCount);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  const userObj = profileData?.user || initialUser || {};
  const profileObj = profileData?.profile || {};
  const giftsList: any[] = Array.isArray(profileData?.giftWall) ? profileData.giftWall : [];
  const totalGiftsCount = giftsList.reduce((acc, g) => acc + (Number(g.qty) || 0), 0);

  const name = userObj.name || initialUser?.name || 'User';
  const rawPhoto = profileObj?.photos?.[0] || userObj.photo || initialUser?.photo || '';
  const photoUrl = rawPhoto && String(rawPhoto).trim() ? (apiAssetUrl(rawPhoto) || rawPhoto) : '/avatar-priya.jpg';

  const age = profileObj.age || initialUser?.age || userObj.age || null;
  const location = profileObj.city || profileObj.location || userObj.location || initialUser?.location || '';
  const bio = profileObj.bio || userObj.bio || initialUser?.bio || 'Looking for meaningful connections and fun conversations!';
  const isVerified = Boolean((userObj.kyc_status || userObj.kycStatus || initialUser?.kycStatus) === 'approved' || userObj.verified || initialUser?.isVerified);
  const isOnline = Boolean(userObj.online || initialUser?.online);
  const uniqueId = String(userObj.unique_id || initialUser?.uniqueId || userObj.id || '').replace(/^STK-/i, '').padStart(6, '0');
  const interests = Array.isArray(profileObj.interests) ? profileObj.interests : ['Music', 'Travel', 'Movies'];
  const joinedDate = userObj.created_at ? new Date(userObj.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Member';
  const targetId = userId || initialUser?.id;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} on Saathika Dating`,
          text: `Check out ${name}'s profile on Saathika!`,
          url: window.location.href,
        });
      } catch (e) {}
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-sm sm:max-w-md bg-[#0D1424] border border-white/15 rounded-[32px] shadow-2xl relative text-white max-h-[94vh] flex flex-col overflow-hidden">
          
          {/* Glow Accents */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

          {/* 1. TOP APP BAR (Back, Avatar + Name, Share, Close) */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/10 shrink-0 bg-[#0D1424]/90 backdrop-blur-md z-20">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Center User Mini Avatar + Name */}
            <div className="flex items-center gap-2 max-w-[180px]">
              <img
                src={photoUrl}
                alt={name}
                className="w-7 h-7 rounded-full object-cover border border-pink-500/40 shadow-sm"
              />
              <span className="font-bold text-sm text-white truncate">{name}</span>
            </div>

            {/* Right Actions: Share & Close */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Share Profile"
              >
                <Share2 size={17} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. TAB NAVIGATION BAR (Profile | Honor | Moment 0 | Relationships) */}
          <div className="flex items-center justify-around px-3 pt-1 border-b border-white/10 bg-[#0D1424]/70 shrink-0 select-none">
            {/* Tab: Profile */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 px-2 text-xs font-black transition relative cursor-pointer ${
                activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Profile</span>
              {activeTab === 'profile' && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] rounded-full shadow-[0_0_8px_#EC4899]" />
              )}
            </button>

            {/* Tab: Honor (Reward Box) */}
            <button
              type="button"
              onClick={() => setActiveTab('honor')}
              className={`pb-2.5 px-2 text-xs font-black transition relative cursor-pointer flex items-center gap-1 ${
                activeTab === 'honor' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Honor</span>
              {totalGiftsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-black leading-tight">
                  {totalGiftsCount}
                </span>
              )}
              {activeTab === 'honor' && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-amber-400 to-[#EC4899] rounded-full shadow-[0_0_8px_#EC4899]" />
              )}
            </button>

            {/* Tab: Moment */}
            <button
              type="button"
              onClick={() => setActiveTab('moment')}
              className={`pb-2.5 px-2 text-xs font-black transition relative cursor-pointer ${
                activeTab === 'moment' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Moment {profileObj?.photos?.length ? profileObj.photos.length : 0}</span>
              {activeTab === 'moment' && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] rounded-full" />
              )}
            </button>

            {/* Tab: Relationships */}
            <button
              type="button"
              onClick={() => setActiveTab('relationships')}
              className={`pb-2.5 px-2 text-xs font-black transition relative cursor-pointer ${
                activeTab === 'relationships' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Relationships</span>
              {activeTab === 'relationships' && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] rounded-full" />
              )}
            </button>
          </div>

          {/* 3. SCROLLABLE TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ===================== TAB: HONOR (REWARD BOX & BADGES WALL) ===================== */}
            {activeTab === 'honor' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Badges Wall Card with VIP and Star Badges */}
                <BadgesWallCard user={userObj} profile={profileObj} isVerified={isVerified} />

                {/* 2. Gifts Honor Wall Card (Reward Box) */}
                <GiftsHonorWallCard
                  userId={targetId}
                  gifts={giftsList}
                  maxDisplay={8}
                />

                {/* Open Full Detailed Gift Wall Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (targetId) router.push(`/user/gift-wall/${targetId}`);
                    else router.push('/user/gift-wall');
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md group"
                >
                  <span>Open Full Gift Wall & Records 🎁</span>
                  <ExternalLink size={14} className="text-amber-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            )}

            {/* ===================== TAB: PROFILE ===================== */}
            {activeTab === 'profile' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Main Image Banner */}
                <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1424] via-transparent to-transparent opacity-90" />

                  {/* Top Right Blue Verified Badge */}
                  {isVerified && (
                    <div
                      className="absolute top-3 right-3 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-[#3B82F6] text-white shadow-[0_2px_10px_rgba(59,130,246,0.7)] border border-white/40"
                      title="Verified User"
                    >
                      <CheckCircle2 size={17} className="fill-white text-[#3B82F6]" />
                    </div>
                  )}

                  {/* Bottom Left Name & Online Tag */}
                  <div className="absolute bottom-3 left-3 right-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white truncate leading-tight">
                        {name}{age ? `, ${age}` : ''}
                      </h2>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-zinc-500'}`} />
                        <span className={`font-bold ${isOnline ? 'text-[#10B981]' : 'text-zinc-400'}`}>
                          {isOnline ? 'Online now' : 'Offline'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ID: {uniqueId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {location && (
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                      <MapPin size={15} className="text-[#EC4899] shrink-0" />
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Location</span>
                        <span className="font-semibold text-white truncate block">{location}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                    <ShieldCheck size={15} className={isVerified ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Verification</span>
                      <span className="font-semibold text-white truncate block">
                        {isVerified ? 'KYC Verified' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                    <Calendar size={15} className="text-purple-400 shrink-0" />
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Joined</span>
                      <span className="font-semibold text-white truncate block">{joinedDate}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                    <User size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Status</span>
                      <span className="font-semibold text-white truncate block">{isOnline ? 'Active' : 'Away'}</span>
                    </div>
                  </div>
                </div>

                {/* Instagram Style Stats Row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl text-center">
                  <div
                    onClick={() => {
                      setFollowersModalTab('followers');
                      setShowFollowersModal(true);
                    }}
                    className="cursor-pointer hover:bg-white/10 rounded-xl p-1 transition group"
                    title="Click to view Followers"
                  >
                    <span className="block font-black text-base text-white group-hover:text-[#EC4899] transition">{followerCount}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Followers</span>
                  </div>
                  <div
                    onClick={() => {
                      setFollowersModalTab('following');
                      setShowFollowersModal(true);
                    }}
                    className="cursor-pointer hover:bg-white/10 rounded-xl p-1 transition group"
                    title="Click to view Following"
                  >
                    <span className="block font-black text-base text-pink-400 group-hover:text-[#FF5DAB] transition">{profileData?.followingCount || 0}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Following</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('honor')}
                    className="cursor-pointer hover:bg-white/10 rounded-xl p-1 transition group"
                    title="View Honor Wall"
                  >
                    <span className="block font-black text-base text-amber-300 group-hover:text-amber-200 transition">{totalGiftsCount}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gifts 🎁</span>
                  </div>
                </div>

                {/* Honor & Reward Showcase Banner */}
                <div
                  onClick={() => setActiveTab('honor')}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/30 cursor-pointer group transition flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-[#EC4899] flex items-center justify-center text-xl shadow-md">
                      🎁
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>Reward Box & Honor Wall</span>
                        <Sparkles size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
                      </h4>
                      <p className="text-[10px] font-semibold text-zinc-400">
                        {totalGiftsCount > 0 ? `${totalGiftsCount} Gifts Received • Tap to view` : 'Badges & Received Gifts Showcase'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-300 group-hover:translate-x-0.5 transition px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    View &gt;
                  </span>
                </div>

                {/* Bio Section */}
                <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block">About Bio</span>
                  <p className="text-zinc-200 leading-relaxed italic">&quot;{bio}&quot;</p>
                </div>

                {/* Interests Badges */}
                {interests.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block">Interests</span>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((item: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-pink-300">
                          #{item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===================== TAB: MOMENT ===================== */}
            {activeTab === 'moment' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {profileObj?.photos?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {profileObj.photos.map((pic: string, idx: number) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-md">
                        <img
                          src={apiAssetUrl(pic) || pic}
                          alt={`${name} Moment ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <div className="text-3xl">📸</div>
                    <p className="text-xs font-bold text-zinc-300">No moments posted yet</p>
                    <p className="text-[10px] text-zinc-500">
                      When {name} shares moments, they will appear here!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===================== TAB: RELATIONSHIPS ===================== */}
            {activeTab === 'relationships' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div
                  onClick={() => {
                    setFollowersModalTab('followers');
                    setShowFollowersModal(true);
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/40 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Followers</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{followerCount} people follow {name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-pink-400 group-hover:translate-x-0.5 transition">View &gt;</span>
                </div>

                <div
                  onClick={() => {
                    setFollowersModalTab('following');
                    setShowFollowersModal(true);
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <Heart size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Following</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{profileData?.followingCount || 0} people followed</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-400 group-hover:translate-x-0.5 transition">View &gt;</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. BOTTOM ACTION BAR (Voice Call, Chat, Big 'Hi' / Message Button) */}
          <div className="p-3.5 bg-[#0A0E1A]/95 border-t border-white/10 shrink-0 flex items-center gap-2.5 z-20">
            {/* Circular Voice Call Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onVoiceCall) onVoiceCall();
                else router.push(`/user/chat/${uniqueId || targetId}?call=voice`);
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white transition cursor-pointer shadow-md shrink-0"
              title="Voice Call"
            >
              <Phone size={18} />
            </button>

            {/* Circular Chat Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                const targetSlug = uniqueId || String(targetId || '').padStart(6, '0');
                router.push(`/user/chat/${targetSlug}`);
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white transition cursor-pointer shadow-md shrink-0"
              title="Chat"
            >
              <MessageCircle size={18} />
            </button>

            {/* Big Wide Orange / Yellow Action Button matching screenshot */}
            <div className="flex-1">
              {hasExistingChat ? (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    const targetSlug = uniqueId || String(targetId || '').padStart(6, '0');
                    router.push(`/user/chat/${targetSlug}`);
                  }}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F59E0B] hover:from-[#EA580C] hover:to-[#D97706] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.4)] border-0 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] transition"
                >
                  <MessageCircle size={18} />
                  <span>Send Message</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setSayHiTarget({ id: targetId, name, photo: photoUrl, location });
                  }}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F59E0B] hover:from-[#EA580C] hover:to-[#D97706] text-white font-black text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.4)] border-0 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] transition"
                >
                  <span className="text-xl">👋</span>
                  <span className="italic font-black tracking-wide">Hi</span>
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Followers & Following List Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        initialTab={followersModalTab}
        userId={targetId}
      />

      {/* Say Hi Modal */}
      <SayHiModal
        isOpen={Boolean(sayHiTarget)}
        onClose={() => {
          setSayHiTarget(null);
          onClose();
        }}
        targetUser={sayHiTarget}
        currentCoins={userCoins}
      />
    </>
  );
}
