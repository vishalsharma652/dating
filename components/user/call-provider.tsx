'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC } from '@/lib/useWebRTC';
import { VoiceCallModal } from './voice-call-modal';
import { VideoCallModal } from './video-call-modal';
import { IncomingCallModal } from './incoming-call-modal';

type WebRTCHook = ReturnType<typeof useWebRTC>;

const CallContext = createContext<WebRTCHook | null>(null);

export function useCall() {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const callState = useWebRTC();

  return (
    <CallContext.Provider value={callState}>
      {children}

      {/* Global Modals rendered on top of everything */}
      
      {/* Incoming Call Notification */}
      {callState.incomingCall && (
        <IncomingCallModal
          call={callState.incomingCall}
          onAccept={() => callState.acceptCall(callState.incomingCall!)}
          onReject={() => callState.rejectCall(callState.incomingCall!.callerId)}
        />
      )}

      {/* Outgoing/Active Calls */}
      {callState.status !== 'idle' && !callState.incomingCall && (
        <>
          {callState.callType === 'voice' && (
            <VoiceCallModal
              peerName={callState.peerName}
              peerPhoto={callState.peerPhoto}
              status={callState.status}
              muted={callState.muted}
              duration={callState.duration}
              onEndCall={callState.endCall}
              onToggleMute={callState.toggleMute}
            />
          )}

          {callState.callType === 'video' && (
            <VideoCallModal
              peerName={callState.peerName}
              peerPhoto={callState.peerPhoto}
              status={callState.status}
              muted={callState.muted}
              cameraOn={callState.cameraOn}
              duration={callState.duration}
              localStream={callState.localStream}
              remoteStream={callState.remoteStream}
              onEndCall={callState.endCall}
              onToggleMute={callState.toggleMute}
              onToggleCamera={callState.toggleCamera}
              onFlipCamera={callState.flipCamera}
            />
          )}
        </>
      )}
    </CallContext.Provider>
  );
}
