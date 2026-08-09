'use client';

import { useState } from 'react';
import { Phone, Video, Info, ArrowLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
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
  const name = user?.name || 'User';

  return (
    <>
      <div className="sticky top-0 bg-[#0D1120] dark:bg-zinc-950 border-b border-white/10 p-3 sm:p-4 flex items-center justify-between z-20 text-white">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <Link 
            href="/user/chat" 
            title="Back to chats"
            className="p-2 -ml-1 hover:bg-white/10 rounded-xl transition text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-bold border border-white/5 bg-white/[0.02]"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          {/* User Photo & Name (Click to open profile) */}
          <div 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group hover:opacity-95 transition"
            title="Click to view profile"
          >
            <div className="relative group-hover:scale-105 transition duration-200">
              <Avatar src={user?.photo || ''} alt={name} fallback={name[0]} />
              {online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0D1120]" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight group-hover:text-pink-400 transition-colors">{name}</h3>
              <p className="text-xs text-zinc-400">
                {online ? 'Online now' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Live coin balance chip for boy users */}
        {isBoy && coinBalance !== null && coinBalance !== undefined && (
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mr-2 transition-colors ${
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

        <div className="flex items-center gap-1">
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
