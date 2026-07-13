'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from './socket';
import { getStoredUser } from './api';

// ── Types ────────────────────────────────────────────────────────
export type CallType   = 'voice' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy' | 'failed';

export interface IncomingCall {
  callerId:    string;
  callerName:  string;
  callerPhoto: string;
  callType:    CallType;
}

// ── STUN servers (public Google servers + open relay for fallback) ─
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export { formatDuration };

// ── Hook ─────────────────────────────────────────────────────────
export function useWebRTC() {
  const [status,       setStatus]       = useState<CallStatus>('idle');
  const [callType,     setCallType]     = useState<CallType>('voice');
  const [peerId,       setPeerId]       = useState<string | null>(null);
  const [peerName,     setPeerName]     = useState<string>('');
  const [peerPhoto,    setPeerPhoto]    = useState<string>('');
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [duration,     setDuration]     = useState(0);
  const [muted,        setMuted]        = useState(false);
  const [cameraOn,     setCameraOn]     = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const makingOffer    = useRef(false);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  // ── Timer helpers ──────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setDuration(0);
  }, []);

  // ── Cleanup all call state ─────────────────────────────────────
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    iceCandidateQueue.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setCameraOn(true);
    stopTimer();
  }, [stopTimer]);

  // ── Create RTCPeerConnection ───────────────────────────────────
  const createPC = useCallback((remotePeerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const socket = connectSocket();

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('call:ice-candidate', { peerId: remotePeerId, candidate });
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0]) setRemoteStream(streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('connected');
        startTimer();
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setStatus('ended');
        cleanup();
      }
    };

    pcRef.current = pc;
    iceCandidateQueue.current = [];
    return pc;
  }, [startTimer, cleanup]);

  // ── Process queued ICE candidates ──────────────────────────────
  const processIceQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queue = [...iceCandidateQueue.current];
    iceCandidateQueue.current = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[WebRTC] failed to add queued candidate', e);
      }
    }
  }, []);

  // ── Get local media ────────────────────────────────────────────
  const getLocalMedia = useCallback(async (type: CallType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      setStatus('failed');
      return null;
    }
  }, []);

  // ── INITIATE call (caller side) ────────────────────────────────
  const initiateCall = useCallback(async (
    targetUserId: string,
    type: CallType,
    targetName  = 'User',
    targetPhoto = '/placeholder.svg',
  ) => {
    if (status !== 'idle') return;

    const currentUser = getStoredUser<{ name?: string; photo?: string }>();
    const socket = connectSocket();

    setPeerId(targetUserId);
    setPeerName(targetName);
    setPeerPhoto(targetPhoto);
    setCallType(type);
    setStatus('calling');

    const stream = await getLocalMedia(type);
    if (!stream) return;

    const pc = createPC(targetUserId);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    socket.emit('call:initiate', {
      calleeId:    targetUserId,
      callType:    type,
      callerName:  currentUser?.name  || 'Unknown',
      callerPhoto: currentUser?.photo || null,
    });
  }, [status, getLocalMedia, createPC]);

  // ── ACCEPT incoming call (callee side) ────────────────────────
  const acceptCall = useCallback(async (incoming: IncomingCall) => {
    const socket = connectSocket();

    setPeerId(incoming.callerId);
    setPeerName(incoming.callerName);
    setPeerPhoto(incoming.callerPhoto);
    setCallType(incoming.callType);
    setStatus('ringing');
    setIncomingCall(null);

    const stream = await getLocalMedia(incoming.callType);
    if (!stream) return;

    const pc = createPC(incoming.callerId);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    socket.emit('call:accept', { callerId: incoming.callerId });
  }, [getLocalMedia, createPC]);

  // ── REJECT incoming call ──────────────────────────────────────
  const rejectCall = useCallback((callerId: string) => {
    connectSocket().emit('call:reject', { callerId });
    setIncomingCall(null);
  }, []);

  // ── END call ──────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (peerId) connectSocket().emit('call:end', { peerId });
    cleanup();
    setStatus('ended');
    setPeerId(null);
    // Reset to idle after brief 'ended' flash
    setTimeout(() => setStatus('idle'), 1500);
  }, [peerId, cleanup]);

  // ── MUTE / CAMERA controls ────────────────────────────────────
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !cameraOn; });
    setCameraOn(c => !c);
  }, [cameraOn]);

  const flipCamera = useCallback(async () => {
    // Stop current video track and get opposite facing mode
    const current = localStreamRef.current?.getVideoTracks()[0];
    const currentFacing = (current?.getSettings().facingMode || 'user') as 'user' | 'environment';
    const nextFacing: 'user' | 'environment' = currentFacing === 'user' ? 'environment' : 'user';

    current?.stop();

    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];

      // Replace in peer connection
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newVideoTrack);

      // Replace in local stream
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => {
          localStreamRef.current?.removeTrack(t);
        });
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch {
      // Flip not supported on this device — ignore
    }
  }, []);

  // ── Socket.IO event listeners ─────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    // ── Incoming call notification ──────────────────────────────
    const onIncoming = (data: IncomingCall) => {
      // Only show if not already in a call
      if (pcRef.current) {
        // Busy — reject automatically
        socket.emit('call:reject', { callerId: data.callerId });
        return;
      }
      setIncomingCall(data);
    };

    // ── Callee accepted → create & send SDP offer ───────────────
    const onAccepted = async ({ calleeId }: { calleeId: string }) => {
      const pc = pcRef.current;
      if (!pc || makingOffer.current) return;
      try {
        makingOffer.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { peerId: calleeId, offer });
        setStatus('ringing');
      } finally {
        makingOffer.current = false;
      }
    };

    // ── Callee rejected ─────────────────────────────────────────
    const onRejected = () => {
      cleanup();
      setStatus('rejected');
      setPeerId(null);
      setTimeout(() => setStatus('idle'), 2000);
    };

    // ── Call ended by peer ──────────────────────────────────────
    const onEnded = () => {
      cleanup();
      setStatus('ended');
      setPeerId(null);
      setTimeout(() => setStatus('idle'), 1500);
    };

    // ── Received SDP offer → create answer ──────────────────────
    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        processIceQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { peerId: from, answer });
      } catch (e) {
        console.error('[WebRTC] offer handling failed:', e);
      }
    };

    // ── Received SDP answer ─────────────────────────────────────
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState === 'stable') return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        processIceQueue();
      } catch (e) {
        console.error('[WebRTC] answer handling failed:', e);
      }
    };

    // ── Received ICE candidate ──────────────────────────────────
    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      } catch { /* ignore stale candidates */ }
    };

    socket.on('call:incoming',      onIncoming);
    socket.on('call:accepted',      onAccepted);
    socket.on('call:rejected',      onRejected);
    socket.on('call:ended',         onEnded);
    socket.on('call:offer',         onOffer);
    socket.on('call:answer',        onAnswer);
    socket.on('call:ice-candidate', onIce);

    return () => {
      socket.off('call:incoming',      onIncoming);
      socket.off('call:accepted',      onAccepted);
      socket.off('call:rejected',      onRejected);
      socket.off('call:ended',         onEnded);
      socket.off('call:offer',         onOffer);
      socket.off('call:answer',        onAnswer);
      socket.off('call:ice-candidate', onIce);
    };
  }, [cleanup, processIceQueue]);

  return {
    // State
    status, callType, peerId, peerName, peerPhoto,
    localStream, remoteStream,
    duration, muted, cameraOn,
    incomingCall,
    // Actions
    initiateCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera, flipCamera,
  };
}
