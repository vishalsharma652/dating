'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Signal, SignalLow, SignalMedium } from 'lucide-react';
import { formatDuration } from '@/lib/useWebRTC';
import type { CallStatus } from '@/lib/useWebRTC';

interface VoiceCallModalProps {
  peerName:     string;
  peerPhoto:    string;
  status:       CallStatus;
  muted:        boolean;
  duration:     number;
  onEndCall:    () => void;
  onToggleMute: () => void;
}

export function VoiceCallModal({
  peerName, peerPhoto, status, muted, duration, onEndCall, onToggleMute,
}: VoiceCallModalProps) {

  const signalStrength = duration % 12 < 4 ? 'good' : duration % 12 < 8 ? 'medium' : 'poor';
  const SignalIcon  = signalStrength === 'poor' ? SignalLow : signalStrength === 'medium' ? SignalMedium : Signal;
  const signalColor = signalStrength === 'poor' ? 'text-red-400' : signalStrength === 'medium' ? 'text-yellow-400' : 'text-green-400';

  const statusLabel: Record<CallStatus, string> = {
    idle:      '',
    calling:   '📞 Calling…',
    ringing:   '🔔 Ringing…',
    connected: '🟢 Connected',
    ended:     '📵 Call ended',
    rejected:  '❌ Call declined',
    busy:      '🔴 User is busy',
    failed:    '⚠️ Microphone access denied',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 pt-12 pb-10 flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {(status === 'calling' || status === 'ringing') && (
              <>
                <div className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping scale-125 [animation-delay:300ms]" />
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={peerPhoto || '/placeholder.svg'}
              alt={peerName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/10 relative z-10"
            />
            {status === 'connected' && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-zinc-950 z-20 animate-pulse" />
            )}
          </div>

          {/* Name + status */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{peerName}</h2>
            <p className="mt-1 text-sm font-medium text-zinc-400">{statusLabel[status]}</p>
          </div>

          {/* Duration + signal */}
          {status === 'connected' && (
            <div className="flex items-center gap-4">
              <span className="text-3xl font-mono font-bold text-white tabular-nums">
                {formatDuration(duration)}
              </span>
              <SignalIcon size={20} className={`${signalColor} transition-colors`} />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={onToggleMute}
              disabled={status !== 'connected'}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 ${
                muted ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(239,68,68,0.5)] transition-all"
            >
              <PhoneOff size={26} />
            </button>
          </div>

          {muted && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 animate-in fade-in">
              <MicOff size={12} /> Microphone muted
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
