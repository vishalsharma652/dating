'use client';

import { Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

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
  const name = user?.name || 'User';

  return (
    <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800 p-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <Avatar src={user?.photo || '/placeholder.svg'} alt={name} fallback={name[0]} />
          {online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-950" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-zinc-500">
            {online ? 'Online now' : 'Offline'}
          </p>
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
          <span>🪙</span>
          <span>{coinBalance} coins</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-green-500/10 hover:text-green-600 transition-colors"
          onClick={onVoiceCall}
          title="Voice call"
        >
          <Phone size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
          onClick={onVideoCall}
          title="Video call"
        >
          <Video size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" title="Info">
          <Info size={18} />
        </Button>
      </div>
    </div>
  );
}
