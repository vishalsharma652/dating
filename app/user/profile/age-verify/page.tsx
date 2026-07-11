'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { userApi } from '@/lib/api';

function calculateAge(date: Date) {
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / 1000 / 60 / 60 / 24 / 365.25);
}

export default function AgeVerificationPage() {
  const router = useRouter();
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => (dob ? calculateAge(new Date(dob)) : null), [dob]);
  const eligible = age !== null && age >= 18;
  const maxDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dob) {
      setError('Select your date of birth to continue.');
      return;
    }
    if (!eligible) {
      setError('You must be 18 years or older to join Saathika.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      localStorage.setItem('onboardDob', dob);
      await userApi.ageVerify(dob);
      router.push('/user/profile/kyc');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify age.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_30%)] p-4">
      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/verify-otp" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              <ArrowLeft size={16} /> Back to OTP
            </Link>
            <h1 className="mt-4 text-3xl font-bold">Age verification</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Confirm you are 18+ so your profile stays visible to verified matches.</p>
          </div>
          <div className="rounded-3xl bg-white/90 px-4 py-3 text-sm font-semibold text-zinc-700 shadow-lg shadow-zinc-900/5 backdrop-blur dark:bg-zinc-950/70 dark:text-zinc-200">
            {age !== null ? `${age} years old` : 'Awaiting birth date'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-pink-500">Step 3</p>
                <h2 className="mt-3 text-2xl font-semibold">Your birth date</h2>
              </div>
              <ShieldCheck className="text-pink-500" size={28} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Date of birth
                <Input
                  type="date"
                  value={dob}
                  onChange={(event) => {
                    setDob(event.target.value);
                    setError('');
                  }}
                  max={maxDate}
                  className="mt-2"
                />
              </label>

              <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Eligibility</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {dob ? (eligible ? 'You meet the age requirement and may continue to KYC verification.' : 'You must be 18 or older to continue. Update your birth date if this is incorrect.') : 'We will calculate your age automatically once you pick your date of birth.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Age requirement</p>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Members must be at least 18 years old for community safety and trust.</p>
              </div>
              <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Backend verified</p>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Your birth date is saved to your account before KYC starts.</p>
              </div>
            </div>

            {error && <p className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>}

            <Button type="submit" className="w-full h-12" disabled={!dob || !eligible || loading}>
              {loading ? 'Confirming...' : 'Continue to KYC'}
            </Button>
          </Card>
        </form>
      </Container>
    </div>
  );
}
