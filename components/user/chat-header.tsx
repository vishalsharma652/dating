'use client';

import { Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface ChatHeaderProps {
  user: any;
  online?: boolean;
}

export function ChatHeader({ user, online = false }: ChatHeaderProps) {
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

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="rounded-full">
          <Phone size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Video size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Info size={18} />
        </Button>
      </div>
    </div>
  );
}
