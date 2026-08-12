'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MapPin, Calendar, ShieldCheck, Heart, Sparkles, CheckCircle2, User, Phone, Video, UserPlus, UserCheck, Users, Clock, MessageCircle, Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { userApi, authApi, apiAssetUrl } from '@/lib/api';
import { FollowersModal } from '@/components/user/followers-modal';
import { SayHiModal } from '@/components/user/say-hi-modal';
import { GiftWall } from '@/components/user/gift-wall';

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-[#0D1424] border border-white/15 rounded-3xl p-4.5 sm:p-5 shadow-2xl relative text-white space-y-3.5 max-h-[92vh] overflow-y-auto">
        
        {/* Glow Accents */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Main Header / Image Banner */}
        <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden shadow-xl border border-white/10 mt-1">
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
          <div>
            <span className="block font-black text-base text-emerald-400">{isVerified ? '100%' : 'Standard'}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trust</span>
          </div>
        </div>

        {/* Actions Row: Follow & Say Hi / Message */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            disabled={followLoading}
            onClick={handleFollowToggle}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md border-0 cursor-pointer ${
              followStatus === 'accepted'
                ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                : followStatus === 'pending'
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-[#0095F6] hover:bg-[#1877F2] text-white font-extrabold tracking-wide'
            }`}
          >
            {followStatus === 'accepted' ? (
              <>
                <UserCheck size={15} className="text-pink-400" />
                <span>Following ✓</span>
              </>
            ) : followStatus === 'pending' ? (
              <>
                <Clock size={15} />
                <span>Requested ⏳</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Follow</span>
              </>
            )}
          </Button>

          {hasExistingChat ? (
            <Button
              type="button"
              onClick={() => {
                onClose();
                const targetSlug = uniqueId || String(userId || initialUser?.id || '').padStart(6, '0');
                router.push(`/user/chat/${targetSlug}`);
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md border-0 cursor-pointer"
            >
              <MessageCircle size={15} />
              <span>Message 💬</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                const targetId = userId || initialUser?.id;
                setSayHiTarget({ id: targetId, name, photo: photoUrl, location });
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#EC4899] via-pink-600 to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md border-0 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Say Hi 👋</span>
            </Button>
          )}
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

        {/* Gift Wall Action Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            const targetId = userId || initialUser?.id;
            if (targetId) {
              router.push(`/user/gift-wall/${targetId}`);
            } else {
              router.push('/user/gift-wall');
            }
          }}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-black transition flex items-center justify-between shadow-md cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift size={16} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-white text-xs flex items-center gap-1.5">
                <span>Gift Wall 🎁</span>
                <Sparkles size={11} className="text-amber-400 fill-amber-400" />
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                {profileData?.giftWall?.length
                  ? `${profileData.giftWall.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0)} Gifts Received`
                  : 'View Virtual Gifts'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-300 font-extrabold text-[11px] group-hover:translate-x-0.5 transition bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
            <span>View Wall</span>
            <ExternalLink size={12} />
          </div>
        </button>

        {/* Call Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {onVoiceCall && (
            <Button
              type="button"
              onClick={() => { onClose(); onVoiceCall(); }}
              className="flex-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Phone size={15} /> Voice Call
            </Button>
          )}
          {onVideoCall && (
            <Button
              type="button"
              onClick={() => { onClose(); onVideoCall(); }}
              className="flex-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-bold text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Video size={15} /> Video Call
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Followers & Following List Modal */}
    <FollowersModal
      isOpen={showFollowersModal}
      onClose={() => setShowFollowersModal(false)}
      initialTab={followersModalTab}
      userId={userId || initialUser?.id}
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
