'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  UserCheck, 
  Zap,
  Smile
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { userApi, authApi, getStoredUser } from '@/lib/api';

const statusClasses: Record<string, string> = {
  Pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'Under review': 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  Verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function KYCPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [selectedSelfieFile, setSelectedSelfieFile] = useState<File | null>(null);
  const [selfieStatus, setSelfieStatus] = useState('Pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Camera Selfie State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-fill Full Name from User API / Cache and lock it
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser?.name) {
      setFullName(storedUser.name);
    }

    authApi.me()
      .then((res) => {
        if (res?.user?.name) {
          setFullName(res.user.name);
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          const storedName = localStorage.getItem('onboardName');
          if (storedName) setFullName(storedName);
        }
      });
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const isReady = useMemo(
    () => Boolean(fullName.trim()) && Boolean(selfiePreview) && Boolean(selectedSelfieFile),
    [fullName, selfiePreview, selectedSelfieFile]
  );

  const handleSelfieChange = (file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setSelfiePreview(preview);
    setSelectedSelfieFile(file);
    setSelfieStatus('Under review');
  };

  // Start live webcam / camera stream
  const startCamera = async () => {
    setCameraError('');
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check camera permissions or select a photo file.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError('');
  };

  // Capture photo from live camera
  const captureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'live_selfie.jpg', { type: 'image/jpeg' });
        handleSelfieChange(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady || !selectedSelfieFile) {
      setError('Please capture or upload your live selfie photo to proceed.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('fullName', fullName);
      payload.append('documents', selectedSelfieFile);

      await userApi.submitKyc(payload);
      router.push('/user/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B18] text-white p-4 sm:p-6 relative overflow-hidden flex flex-col justify-center items-center">
      {/* Glowing Radial Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#EC4899]/15 to-[#7C3AED]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <Container className="max-w-xl relative z-10 w-full my-auto">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/user/profile" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all duration-300 backdrop-blur-md"
          >
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Instant Verification</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-[#101827]/70 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Card Top Banner Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#EC4899] via-[#7C3AED] to-[#3B82F6]" />

          {/* Title Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-[0_0_25px_rgba(236,72,153,0.3)]">
              <ShieldCheck className="text-pink-500" size={32} />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
              Identity Verification
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm mx-auto font-medium leading-relaxed">
              Take a quick live selfie photo to verify your profile and earn the <span className="text-pink-400 font-bold">Verified Badge ✓</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto-filled & Locked User Name */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1">
                  <UserCheck size={13} className="text-pink-500" />
                  <span>Account Holder Name</span>
                  <Lock size={11} className="text-zinc-500 ml-1" />
                </label>
                <div className="text-base font-bold text-white tracking-wide">
                  {fullName || 'Loading Profile...'}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold text-pink-400">
                <Zap size={12} /> Auto-Verified Name
              </div>
            </div>

            {/* Live Selfie Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Smile size={14} className="text-pink-500" />
                  <span>Live Photo Verification</span>
                </label>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusClasses[selfieStatus] || statusClasses.Pending}`}>
                  {selfieStatus}
                </span>
              </div>

              <div className="relative group flex flex-col justify-center items-center rounded-3xl border-2 border-dashed border-pink-500/40 bg-gradient-to-b from-pink-500/[0.04] to-transparent p-6 text-center transition-all duration-300 hover:border-pink-500 hover:bg-pink-500/[0.07]">
                
                {selfiePreview ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img 
                        src={selfiePreview} 
                        alt="Live Selfie" 
                        className="w-36 h-36 rounded-2xl object-cover border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]" 
                      />
                      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                        <CheckCircle2 size={20} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Live Photo Captured
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-3 text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 px-4 py-2 rounded-xl transition duration-300"
                    >
                      <RefreshCw size={13} /> Retake Live Photo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                      <Camera size={30} className="text-pink-500 animate-pulse" />
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1">Take a Live Selfie</h4>
                    <p className="text-xs text-zinc-400 max-w-xs mb-5 font-normal leading-relaxed">
                      Look directly at the camera with clear lighting to instantly complete identity check.
                    </p>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="w-full bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Camera size={16} /> 📸 Take Live Selfie Photo
                      </Button>
                      
                      <label className="text-[11px] font-semibold text-zinc-400 hover:text-pink-400 underline cursor-pointer transition">
                        Or select photo file from device
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={(event) => handleSelfieChange(event.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-400 text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-extrabold text-sm uppercase tracking-wider border-0 shadow-[0_10px_30px_rgba(236,72,153,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!isReady || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={16} /> Submitting Verification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles size={16} /> Submit Verification
                </span>
              )}
            </Button>
          </form>
        </Card>
      </Container>

      {/* Live Camera Modal Overlay */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm rounded-[32px] bg-[#101827] border border-white/10 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-600" />
            
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white rounded-full p-2 bg-white/5 hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-3">
              <Camera className="text-pink-500" size={24} />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Take Live Selfie</h3>
            <p className="text-xs text-zinc-400 mb-5">Position your face inside the oval frame below.</p>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-5">
                {cameraError}
              </div>
            ) : (
              <div className="relative mx-auto mb-6 w-64 h-64 overflow-hidden rounded-full border-4 border-pink-500/80 bg-black shadow-[0_0_40px_rgba(236,72,153,0.4)] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover transform -scale-x-100" />
                <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-pink-400/60 animate-pulse" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 justify-center">
              <Button type="button" variant="outline" onClick={stopCamera} className="rounded-xl text-xs font-bold border-white/10 text-zinc-300">
                Cancel
              </Button>
              {!cameraError && (
                <Button
                  type="button"
                  onClick={captureLivePhoto}
                  className="bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs uppercase tracking-wider rounded-xl px-6 shadow-md"
                >
                  <Camera className="mr-1.5" size={15} /> Snap Photo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
