'use client';

import { Phone, PhoneOff, Video } from 'lucide-react';
import type { IncomingCall } from '@/lib/useWebRTC';

interface IncomingCallModalProps {
  call: IncomingCall;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ call, onAccept, onReject }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">

        {/* Ripple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 py-10 flex flex-col items-center gap-5">

          {/* Incoming label */}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {call.callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call'}
          </div>

          {/* Avatar with pulse rings */}
          <div className="relative my-2">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping scale-[1.6]" />
            <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping scale-[1.3] [animation-delay:300ms]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={call.callerPhoto || '/placeholder.svg'}
              alt={call.callerName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/10 relative z-10"
            />
            <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-green-500 border-2 border-zinc-950 shadow-lg">
              {call.callType === 'video' ? <Video size={14} className="text-white" /> : <Phone size={14} className="text-white" />}
            </div>
          </div>

          {/* Caller info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{call.callerName}</h2>
            <p className="text-sm text-zinc-400 mt-1">wants to {call.callType === 'video' ? 'video' : 'voice'} chat with you</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-10 mt-4">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(239,68,68,0.5)] transition-all duration-200"
              >
                <PhoneOff size={26} />
              </button>
              <span className="text-xs text-zinc-500">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(34,197,94,0.5)] transition-all duration-200 animate-bounce"
              >
                {call.callType === 'video' ? <Video size={26} /> : <Phone size={26} />}
              </button>
              <span className="text-xs text-zinc-500">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
