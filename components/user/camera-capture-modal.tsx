'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start live system camera
  const startCamera = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser/device.');
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
      } catch (e) {
        // Fallback to basic video constraint for desktop webcams
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
    } catch (err: any) {
      console.error('System Camera Access Error:', err);
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please click the lock icon in URL bar to allow camera access.'
          : err.message || 'Unable to start system camera.'
      );
    } finally {
      setLoading(false);
    }
  }, [facingMode]);

  // Assign stream to video element when mounted
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => undefined);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for mirror effect
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(capturedFile);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Off-screen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-lg bg-[#0D1424] border border-white/15 rounded-3xl p-5 shadow-2xl relative text-white space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">System Camera</h3>
              <p className="text-[11px] text-zinc-400 font-semibold">Live Camera Preview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Camera Viewfinder */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={() => setLoading(false)}
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
              loading || error ? 'hidden' : 'block'
            }`}
          />

          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/90 text-zinc-400 text-xs font-semibold z-10 p-4 text-center">
              <Loader2 className="animate-spin text-pink-500" size={32} />
              <span>Starting System Camera...</span>
              <p className="text-[10px] text-zinc-500">Please allow camera permissions if prompted by your browser</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-400 space-y-3 bg-black/95 z-10">
              <AlertCircle size={32} className="mx-auto text-red-500" />
              <p className="text-xs font-medium max-w-xs mx-auto leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="rounded-full border-white/20 text-xs text-white cursor-pointer"
                >
                  Retry Access
                </Button>
                <label className="px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-pink-500/30">
                  <span>Open System App</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        stopCamera();
                        onCapture(file);
                        onClose();
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Grid lines overlay */}
          {!loading && !error && (
            <div className="absolute inset-0 border border-white/10 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex items-center justify-around pt-2">
          {/* Flip Front/Back Camera */}
          <button
            type="button"
            onClick={toggleFacingMode}
            disabled={loading || Boolean(error)}
            title="Switch Camera (Front / Rear)"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>

          {/* Shutter Capture Button */}
          <button
            type="button"
            onClick={handleCapturePhoto}
            disabled={loading || Boolean(error)}
            className="w-16 h-16 rounded-full bg-white border-4 border-[#EC4899] hover:scale-105 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center shadow-lg shadow-pink-500/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#7C3AED] flex items-center justify-center text-white">
              <Camera size={22} />
            </div>
          </button>

          {/* Gallery Pick Option */}
          <label
            title="Choose Existing Photo/Video from Gallery"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <ImageIcon size={18} />
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  stopCamera();
                  onCapture(file);
                  onClose();
                }
              }}
            />
          </label>

          {/* Close / Cancel */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
