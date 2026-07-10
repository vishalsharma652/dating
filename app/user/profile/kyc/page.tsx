'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
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
    fullName: localStorage.getItem('onboardName') || '',
    aadhaar: '',
    pan: '',
  });
  const [files, setFiles] = useState({
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
    selfie: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<keyof typeof files, File | null>>({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    selfie: null,
  });
  const [statuses, setStatuses] = useState({
    aadhaar: 'Under review',
    pan: 'Pending',
    selfie: 'Pending',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allComplete = useMemo(
    () =>
      Boolean(formData.fullName.trim()) &&
      /^\d{12}$/.test(formData.aadhaar) &&
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan) &&
      Object.values(files).every(Boolean),
    [formData, files]
  );

  const handleFileChange = (key: keyof typeof files, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const statusKey = key === 'panCard' ? 'pan' : key;

    setFiles((current) => ({ ...current, [key]: preview }));
    setSelectedFiles((current) => ({ ...current, [key]: file }));
    setStatuses((current) => ({ ...current, [statusKey]: 'Under review' }));
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
      payload.append('aadhaar', formData.aadhaar);
      payload.append('pan', formData.pan);
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
            <h1 className="mt-4 text-3xl font-bold">KYC verification</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Upload ID documents and a selfie to confirm your profile identity.</p>
          </div>
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">Pending review</Badge>
        </div>

        <Card className="p-6">
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Document status</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3 dark:bg-zinc-900/80">
                  <span>Aadhaar</span>
                  <span className={statusClasses[statuses.aadhaar] || statusClasses.Pending}>{statuses.aadhaar}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3 dark:bg-zinc-900/80">
                  <span>PAN</span>
                  <span className={statusClasses[statuses.pan] || statusClasses.Pending}>{statuses.pan}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 px-4 py-3 dark:bg-zinc-900/80">
                  <span>Selfie</span>
                  <span className={statusClasses[statuses.selfie] || statusClasses.Pending}>{statuses.selfie}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-sm uppercase tracking-[0.24em] text-pink-500">Secure onboarding</p>
              <h2 className="mt-3 text-2xl font-semibold">Complete the final verification step</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Your uploads are submitted securely to the backend for admin review.
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

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Aadhaar number
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(event) => setFormData({ ...formData, aadhaar: event.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="123412341234"
                  maxLength={12}
                  className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                PAN number
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(event) => setFormData({ ...formData, pan: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                />
              </label>
              <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">What we need</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>• Clear Aadhaar front/back images</li>
                  <li>• PAN card scan</li>
                  <li>• Selfie with visible face</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { label: 'Upload Aadhaar front', key: 'aadhaarFront' as const },
                  { label: 'Upload Aadhaar back', key: 'aadhaarBack' as const },
                  { label: 'Upload PAN card', key: 'panCard' as const },
                  { label: 'Upload selfie', key: 'selfie' as const },
                ] as const
              ).map((item) => (
                <label key={item.key} className="group relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/90 p-4 text-center transition hover:border-pink-500 dark:border-zinc-700 dark:bg-zinc-950/70">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(event) => handleFileChange(item.key, event.target.files?.[0] ?? null)}
                  />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3">
                    <Upload size={28} className="text-pink-500" />
                    <p className="font-semibold text-zinc-900 dark:text-white">{item.label}</p>
                    {files[item.key] ? (
                      <img src={files[item.key]} alt={item.label} className="mx-auto h-24 w-24 rounded-3xl object-cover" />
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Tap to attach</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>}

            <Button type="submit" className="w-full h-12" disabled={!allComplete || loading}>
              {loading ? 'Submitting verification...' : 'Continue to profile setup'}
            </Button>
          </form>
        </Card>
      </Container>
    </div>
  );
}
