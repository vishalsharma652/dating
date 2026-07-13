'use client';

import { useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, FlipHorizontal2, Signal, SignalLow, SignalMedium,
} from 'lucide-react';
import { formatDuration } from '@/lib/useWebRTC';
import type { CallStatus } from '@/lib/useWebRTC';

interface VideoCallModalProps {
  peerName:       string;
  peerPhoto:      string;
  status:         CallStatus;
  muted:          boolean;
  cameraOn:       boolean;
  duration:       number;
  localStream:    MediaStream | null;
  remoteStream:   MediaStream | null;
  onEndCall:      () => void;
  onToggleMute:   () => void;
  onToggleCamera: () => void;
  onFlipCamera:   () => void;
}

export function VideoCallModal({
  peerName, peerPhoto, status, muted, cameraOn, duration,
  localStream, remoteStream,
  onEndCall, onToggleMute, onToggleCamera, onFlipCamera,
}: VideoCallModalProps) {

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to local <video>
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote <video>
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const signalStrength = duration % 12 < 4 ? 'good' : duration % 12 < 8 ? 'medium' : 'poor';
  const SignalIcon  = signalStrength === 'poor' ? SignalLow : signalStrength === 'medium' ? SignalMedium : Signal;
  const signalColor = signalStrength === 'poor' ? 'text-red-400' : signalStrength === 'medium' ? 'text-yellow-400' : 'text-green-400';

  const isConnected = status === 'connected';
  const isCalling   = status === 'calling' || status === 'ringing';

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300 flex flex-col">

      {/* ── Remote video (full-screen background) ─────────────── */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback: show caller photo blurred when no stream yet */
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={peerPhoto || '/placeholder.svg'}
              alt={peerName}
              className="w-full h-full object-cover opacity-25 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          </div>
        )}
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* ── Local video PIP ────────────────────────────────────── */}
      <div className="absolute bottom-36 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-zinc-800">
        {cameraOn && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <VideoOff size={24} className="text-zinc-500" />
          </div>
        )}
      </div>

      {/* ── Calling / ringing state ────────────────────────────── */}
      {isCalling && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping scale-150" />
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping scale-[1.3] [animation-delay:300ms]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={peerPhoto || '/placeholder.svg'}
              alt={peerName}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/20 relative z-10"
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{peerName}</h2>
            <p className="text-blue-300 text-sm mt-1 animate-pulse">
              {status === 'calling' ? '📹 Calling…' : '🔔 Ringing…'}
            </p>
          </div>
        </div>
      )}

      {/* ── HUD — top bar (connected) ──────────────────────────── */}
      {isConnected && (
        <div className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4">
          <div>
            <p className="text-white font-semibold text-lg drop-shadow">{peerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Connected</span>
              <SignalIcon size={14} className={`${signalColor} ml-1`} />
            </div>
          </div>
          <span className="text-white font-mono text-xl font-bold tabular-nums drop-shadow">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* ── Status chips ───────────────────────────────────────── */}
      <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center gap-2">
        {muted && (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/15 border border-red-500/20 backdrop-blur-sm rounded-full px-3 py-1">
            <MicOff size={11} /> Muted
          </span>
        )}
        {!cameraOn && (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/15 border border-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1">
            <VideoOff size={11} /> Camera off
          </span>
        )}
      </div>

      {/* ── Controls bar ───────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-10 pt-4 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center justify-center gap-5">

          {/* Flip camera */}
          <button
            onClick={onFlipCamera}
            disabled={!isConnected || !cameraOn}
            className="w-[52px] h-[52px] rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
            title="Flip camera"
          >
            <FlipHorizontal2 size={22} />
          </button>

          {/* Mute */}
          <button
            onClick={onToggleMute}
            disabled={!isConnected}
            className={`w-[52px] h-[52px] rounded-full backdrop-blur-sm flex items-center justify-center transition-all disabled:opacity-30 active:scale-95 ${
              muted ? 'bg-red-500/30 text-red-400 ring-2 ring-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* End call */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(239,68,68,0.5)] transition-all"
            title="End call"
          >
            <PhoneOff size={26} />
          </button>

          {/* Toggle camera */}
          <button
            onClick={onToggleCamera}
            disabled={!isConnected}
            className={`w-[52px] h-[52px] rounded-full backdrop-blur-sm flex items-center justify-center transition-all disabled:opacity-30 active:scale-95 ${
              !cameraOn ? 'bg-amber-500/30 text-amber-400 ring-2 ring-amber-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          {/* Spacer to balance the flip button */}
          <div className="w-[52px] h-[52px]" />
        </div>
      </div>
    </div>
  );
}
