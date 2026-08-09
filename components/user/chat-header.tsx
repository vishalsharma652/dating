'use client';

import { useState, useEffect } from 'react';
import { Phone, Video, Info, ArrowLeft, Coins, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import { UserProfileModal } from '@/components/user/user-profile-modal';

interface ChatHeaderProps {
  user: any;
  online?: boolean;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  coinBalance?: number | null;
  isBoy?: boolean;
}

export function ChatHeader({
  user,
  online = false,
  onVoiceCall,
  onVideoCall,
  coinBalance,
  isBoy,
}: ChatHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const name = user?.name || 'User';

  useEffect(() => {
    if (user?.id) {
      userApi.getFollowStatus(user.id)
        .then((res) => setFollowing(Boolean(res.following)))
        .catch(() => undefined);
    }
  }, [user?.id]);

  const handleFollowToggle = async () => {
    if (!user?.id || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await userApi.toggleFollow(user.id);
      setFollowing(res.following);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 bg-[#0D1120] dark:bg-zinc-950 border-b border-white/10 p-3 sm:p-4 flex items-center justify-between z-20 text-white gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Link 
            href="/user/chat" 
            title="Back to chats"
            className="p-2 -ml-1 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-bold border border-white/5 bg-white/[0.02] shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          {/* User Photo & Name (Click to open profile) */}
          <div 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group hover:opacity-95 transition min-w-0"
            title="Click to view profile"
          >
            <div className="relative group-hover:scale-105 transition duration-200 shrink-0">
              <Avatar src={user?.photo || ''} alt={name} fallback={name[0]} />
              {online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0D1120]" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight group-hover:text-pink-400 transition-colors truncate">{name}</h3>
              <p className="text-xs text-zinc-400 truncate">
                {online ? 'Online now' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Live coin balance chip for boy users */}
        {isBoy && coinBalance !== null && coinBalance !== undefined && (
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mr-1 transition-colors shrink-0 ${
            coinBalance < 10
              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
              : coinBalance < 30
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              : 'bg-green-500/10 text-green-600 border border-green-500/20'
          }`}>
            <Coins size={14} className="text-amber-500 shrink-0" />
            <span>{coinBalance} coins</span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {/* Follow / Unfollow Button */}
          <Button
            type="button"
            disabled={followLoading}
            onClick={handleFollowToggle}
            className={`h-8 px-2.5 sm:px-3 rounded-full text-xs font-bold transition flex items-center gap-1 border-0 cursor-pointer ${
              following
                ? 'bg-white/10 hover:bg-white/15 text-pink-300 border border-pink-500/30'
                : 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white shadow-md'
            }`}
            title={following ? 'Unfollow user' : 'Follow user'}
          >
            {following ? (
              <>
                <UserCheck size={14} /> <span className="hidden sm:inline">Following</span>
              </>
            ) : (
              <>
                <UserPlus size={14} /> <span className="hidden sm:inline">Follow</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-green-500/10 hover:text-green-600 transition-colors cursor-pointer"
            onClick={onVoiceCall}
            title="Voice call"
          >
            <Phone size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-blue-500/10 hover:text-blue-600 transition-colors cursor-pointer"
            onClick={onVideoCall}
            title="Video call"
          >
            <Video size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-white/10 transition-colors cursor-pointer" 
            onClick={() => setShowProfile(true)}
            title="View user profile"
          >
            <Info size={18} />
          </Button>
        </div>
      </div>

      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        userId={user?.id}
        initialUser={{ ...user, online }}
        onVoiceCall={onVoiceCall}
        onVideoCall={onVideoCall}
      />
    </>
  );
}
