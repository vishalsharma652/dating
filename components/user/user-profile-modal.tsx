'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, Calendar, ShieldCheck, Heart, Sparkles, CheckCircle2, User, Phone, Video, UserPlus, UserCheck, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { userApi, apiAssetUrl } from '@/lib/api';

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
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && (userId || initialUser?.id)) {
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
    }
  }, [isOpen, userId, initialUser]);

  const handleFollowToggle = async () => {
    const targetId = userId || initialUser?.id;
    if (!targetId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await userApi.toggleFollow(targetId);
      setFollowStatus(res.status);
      setFollowerCount(res.followerCount);
    } catch (err: any) {
      console.error('Follow error:', err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-[#0D1424] border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Glow Accents */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Main Header / Image Banner */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-white/10 mt-2">
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
        <div className="grid grid-cols-2 gap-3 text-xs">
          {location && (
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
              <MapPin size={16} className="text-[#EC4899] shrink-0" />
              <div>
                <span className="text-zinc-400 block text-[10px]">Location</span>
                <span className="font-semibold text-white truncate block">{location}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
            <ShieldCheck size={16} className={isVerified ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
            <div>
              <span className="text-zinc-400 block text-[10px]">Verification</span>
              <span className="font-semibold text-white truncate block">
                {isVerified ? 'KYC Verified' : 'Standard'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
            <Calendar size={16} className="text-purple-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px]">Joined</span>
              <span className="font-semibold text-white truncate block">{joinedDate}</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
            <User size={16} className="text-blue-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px]">Status</span>
              <span className="font-semibold text-white truncate block">{isOnline ? 'Active' : 'Away'}</span>
            </div>
          </div>
        </div>

        {/* Instagram Style Stats Row */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl text-center">
          <div>
            <span className="block font-black text-base text-white">{followerCount}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Followers</span>
          </div>
          <div>
            <span className="block font-black text-base text-pink-400">{profileData?.followingCount || 0}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Following</span>
          </div>
          <div>
            <span className="block font-black text-base text-emerald-400">{isVerified ? '100%' : 'Standard'}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trust</span>
          </div>
        </div>

        {/* Full Width Instagram Style Follow / Requested / Following Button */}
        <Button
          type="button"
          disabled={followLoading}
          onClick={handleFollowToggle}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg border-0 cursor-pointer ${
            followStatus === 'accepted'
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              : followStatus === 'pending'
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
              : 'bg-[#0095F6] hover:bg-[#1877F2] text-white font-extrabold tracking-wide'
          }`}
        >
          {followStatus === 'accepted' ? (
            <>
              <UserCheck size={16} className="text-pink-400" />
              <span>Following ✓</span>
            </>
          ) : followStatus === 'pending' ? (
            <>
              <Clock size={16} />
              <span>Requested ⏳</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Follow</span>
            </>
          )}
        </Button>

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
  );
}
