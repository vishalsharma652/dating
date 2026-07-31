'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Camera, CheckCircle2, RefreshCw, X, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { userApi } from '@/lib/api';

const statusClasses: Record<string, string> = {
  Pending: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  'Under review': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  Verified: 'bg-green-500/10 text-green-700 dark:text-green-300',
  Rejected: 'bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function KYCPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
  });
  const [files, setFiles] = useState({
    idFront: '',
    idBack: '',
    selfie: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<keyof typeof files, File | null>>({
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [statuses, setStatuses] = useState({
    idProof: 'Pending',
    selfie: 'Pending',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Camera Selfie State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('onboardName');
      if (storedName) {
        setFormData((current) => ({ ...current, fullName: storedName }));
      }
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const allComplete = useMemo(
    () =>
      Boolean(formData.fullName.trim()) &&
      Object.values(files).every(Boolean),
    [formData, files]
  );

  const handleFileChange = (key: keyof typeof files, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const statusKey = key === 'selfie' ? 'selfie' : 'idProof';

    setFiles((current) => ({ ...current, [key]: preview }));
    setSelectedFiles((current) => ({ ...current, [key]: file }));
    setStatuses((current) => ({ ...current, [statusKey]: 'Under review' }));
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
      setCameraError('Unable to access camera. Please allow camera permissions or upload a selfie file.');
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
        handleFileChange('selfie', file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allComplete) {
      setError('Complete all fields and uploads to proceed.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      Object.values(selectedFiles).forEach((file) => {
        if (file) payload.append('documents', file);
      });
      await userApi.submitKyc(payload);
      router.push('/user/profile/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.1),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_35%)] p-4">
      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/user/profile/age-verify" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              <ArrowLeft size={16} /> Age verification
            </Link>
            <h1 className="mt-4 text-3xl font-bold flex items-center gap-2">
              KYC verification <ShieldCheck className="text-pink-500" size={28} />
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Upload identity document and take a live selfie photo to verify your profile.</p>
          </div>
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">Pending review</Badge>
        </div>

        <Card className="p-6">
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Document status</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3 dark:bg-zinc-900/80">
                  <span>ID Proof</span>
                  <span className={statusClasses[statuses.idProof] || statusClasses.Pending}>{statuses.idProof}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3 dark:bg-zinc-900/80">
                  <span>Selfie Photo</span>
                  <span className={statusClasses[statuses.selfie] || statusClasses.Pending}>{statuses.selfie}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-sm uppercase tracking-[0.24em] text-pink-500 font-semibold">Secure onboarding</p>
              <h2 className="mt-3 text-2xl font-semibold">Complete the final verification step</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Your ID documents and live selfie photo are submitted securely to the backend for admin verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Full name
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                  placeholder="Aarav Patel"
                  className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                />
              </label>

              <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Verification Guidelines</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>• Clear Government-issued ID (Aadhaar / PAN / Passport)</li>
                  <li>• Live selfie photo with face clearly visible</li>
                </ul>
              </div>
            </div>

            {/* Document Upload Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* ID Front */}
              <label className="group relative flex min-h-[180px] flex-col justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/90 p-4 text-center transition hover:border-pink-500 dark:border-zinc-700 dark:bg-zinc-950/70 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-20"
                  onChange={(event) => handleFileChange('idFront', event.target.files?.[0] ?? null)}
                />
                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3">
                  <Upload size={28} className="text-pink-500" />
                  <p className="font-semibold text-zinc-900 dark:text-white">ID Front</p>
                  {files.idFront ? (
                    <img src={files.idFront} alt="ID Front" className="mx-auto h-24 w-24 rounded-2xl object-cover border border-pink-500/50 shadow-md" />
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Tap to upload front</p>
                  )}
                </div>
              </label>

              {/* ID Back */}
              <label className="group relative flex min-h-[180px] flex-col justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/90 p-4 text-center transition hover:border-pink-500 dark:border-zinc-700 dark:bg-zinc-950/70 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-20"
                  onChange={(event) => handleFileChange('idBack', event.target.files?.[0] ?? null)}
                />
                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3">
                  <Upload size={28} className="text-pink-500" />
                  <p className="font-semibold text-zinc-900 dark:text-white">ID Back</p>
                  {files.idBack ? (
                    <img src={files.idBack} alt="ID Back" className="mx-auto h-24 w-24 rounded-2xl object-cover border border-pink-500/50 shadow-md" />
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Tap to upload back</p>
                  )}
                </div>
              </label>

              {/* Live Selfie Box with Camera Capture */}
              <div className="relative flex min-h-[180px] flex-col justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-pink-500/60 bg-pink-500/5 p-4 text-center transition hover:border-pink-500 dark:bg-pink-500/10">
                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3">
                  <Camera size={28} className="text-pink-500 animate-pulse" />
                  <p className="font-semibold text-zinc-900 dark:text-white">Live Selfie Photo</p>
                  
                  {files.selfie ? (
                    <div className="relative group">
                      <img src={files.selfie} alt="Live Selfie" className="mx-auto h-24 w-24 rounded-2xl object-cover border-2 border-green-500 shadow-md" />
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                        <CheckCircle2 size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-2 text-xs font-semibold text-pink-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <RefreshCw size={12} /> Retake Live Photo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:opacity-90"
                      >
                        <Camera size={14} /> 📸 Take Live Selfie Photo
                      </Button>
                      
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 underline cursor-pointer hover:text-pink-500">
                        Or upload selfie file
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={(event) => handleFileChange('selfie', event.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!allComplete || loading}>
              {loading ? 'Submitting verification...' : 'Continue to profile setup'}
            </Button>
          </form>
        </Card>
      </Container>

      {/* Live Camera Modal Overlay */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-center">
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white rounded-full p-2 bg-zinc-800/80"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
              <Camera className="text-pink-500" size={24} /> Take Live Selfie Photo
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Position your face in the center and click snap.</p>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-sm mb-4">
                {cameraError}
              </div>
            ) : (
              <div className="relative mx-auto mb-6 w-full max-w-xs aspect-square overflow-hidden rounded-3xl border-2 border-pink-500 bg-black shadow-inner">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover transform -scale-x-100" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-dashed border-pink-500/40 opacity-70" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 justify-center">
              <Button type="button" variant="outline" onClick={stopCamera} className="rounded-xl">
                Cancel
              </Button>
              {!cameraError && (
                <Button
                  type="button"
                  onClick={captureLivePhoto}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl px-6"
                >
                  <Camera className="mr-2" size={18} /> Snap Photo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
