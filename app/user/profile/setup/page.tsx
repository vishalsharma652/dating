'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { ArrowLeft, Camera, Sparkles, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { userApi } from '@/lib/api';

const genders = ['Female', 'Male', 'Nonbinary', 'Prefer not to say'];
const interestsOptions = ['Travel', 'Fitness', 'Food', 'Music', 'Art', 'Wellness'];
const languageOptions = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'];
const lifestyleOptions = ['Early Riser', 'Night Owl', 'Social Butterfly', 'Fitness Focused'];
const stepLabels = ['Photos & Basics', 'Match Preferences', 'Bio & Lifestyle'];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    interestedIn: 'Men',
    city: '',
    occupation: '',
    education: 'Bachelor’s',
    bio: '',
    photos: ['', '', '', ''],
    languages: [] as string[],
    interests: [] as string[],
    lifestyle: [] as string[],
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>(['', '', '', '']);
  const maxBio = 180;

  const progress = useMemo(() => (step / stepLabels.length) * 100, [step]);

  const handlePhotoUpload = (index: number, file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const nextPhotos = [...photoPreviews];
    nextPhotos[index] = url;
    setPhotoPreviews(nextPhotos);
    setFormData((current) => ({ ...current, photos: nextPhotos }));
  };

  const toggleItem = (key: 'languages' | 'interests' | 'lifestyle', value: string) => {
    setFormData((current) => {
      const currentValues = current[key];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...current, [key]: nextValues };
    });
  };

  const stepValid = useMemo(() => {
    if (step === 1) {
      return (
        Boolean(formData.name.trim()) &&
        Boolean(formData.age) &&
        Boolean(formData.gender) &&
        Boolean(formData.city.trim()) &&
        photoPreviews.some(Boolean)
      );
    }

    if (step === 2) {
      return Boolean(formData.interestedIn) && Boolean(formData.occupation.trim()) && Boolean(formData.languages.length);
    }

    return Boolean(formData.bio.trim()) && Boolean(formData.interests.length) && Boolean(formData.lifestyle.length);
  }, [step, formData, photoPreviews]);

  const handleNext = async () => {
    if (!stepValid) return;
    if (step === stepLabels.length) {
      setLoading(true);
      setError('');
      try {
        await userApi.updateProfile({
          ...formData,
          age: Number(formData.age),
          location: formData.city,
          photos: formData.photos.filter(Boolean),
        });
        router.push('/user/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save profile.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_35%)] p-4">
      <Container>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/user/profile/kyc" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              <ArrowLeft size={16} /> Back to KYC
            </Link>
            <h1 className="mt-4 text-3xl font-bold">Complete your profile</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Add photos, preferences, and a confident bio to unlock personalized matches.</p>
          </div>
          <div className="rounded-3xl bg-white/90 px-4 py-3 text-sm font-semibold text-zinc-700 shadow-lg shadow-zinc-900/5 backdrop-blur dark:bg-zinc-950/70 dark:text-zinc-200">
            Step {step} of {stepLabels.length}
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/90 shadow-xl shadow-zinc-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4 text-sm text-zinc-600 dark:text-zinc-400">
            {stepLabels.map((label, index) => (
              <div key={label} className="flex-1 text-center">
                <div className={`mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full border ${step === index + 1 ? 'border-pink-500 bg-pink-500 text-white' : 'border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}>
                  {index + 1}
                </div>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6">
          {error && <p className="mb-6 rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="space-y-10">
            {step === 1 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-pink-500">Step 1</p>
                      <h2 className="mt-3 text-xl font-semibold">Add profile photos</h2>
                    </div>
                    <Camera className="text-pink-500" size={26} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Upload at least one photo so your profile appears more authentic and engaging.</p>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {photoPreviews.map((preview, index) => (
                      <label
                        key={index}
                        className="group flex h-36 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white text-center text-zinc-500 transition hover:border-pink-500 hover:text-pink-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handlePhotoUpload(index, event.target.files?.[0] ?? null)}
                        />
                        {preview ? (
                          <div
                            className="h-full w-full rounded-3xl bg-cover bg-center"
                            style={{ backgroundImage: `url(${preview})` }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 px-2">
                            <Camera size={24} />
                            <span className="text-xs font-medium">Upload</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Full name
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      placeholder="Aarav Patel"
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    />
                  </label>

                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Age
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(event) => setFormData({ ...formData, age: event.target.value })}
                      placeholder="28"
                      min={18}
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    />
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Gender
                    <select
                      value={formData.gender}
                      onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    >
                      {genders.map((gender) => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    City
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                      placeholder="Mumbai"
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-pink-500">Step 2</p>
                      <h2 className="mt-3 text-xl font-semibold">Match preferences</h2>
                    </div>
                    <Sparkles className="text-pink-500" size={26} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Choose your preferences to surface compatible profiles faster.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Interested in
                    <select
                      value={formData.interestedIn}
                      onChange={(event) => setFormData({ ...formData, interestedIn: event.target.value })}
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Everyone">Everyone</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Occupation
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(event) => setFormData({ ...formData, occupation: event.target.value })}
                      placeholder="Product Designer"
                      className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Education
                  <select
                    value={formData.education}
                    onChange={(event) => setFormData({ ...formData, education: event.target.value })}
                    className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                  >
                    <option value="Bachelor’s">Bachelor’s</option>
                    <option value="Master’s">Master’s</option>
                    <option value="Professional">Professional</option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </label>

                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Languages</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languageOptions.map((language) => {
                      const selected = formData.languages.includes(language);
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => toggleItem('languages', language)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${selected ? 'border-pink-500 bg-pink-500/10 text-pink-700' : 'border-zinc-300 bg-white text-zinc-700 hover:border-pink-500 hover:text-pink-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-pink-500 dark:hover:text-pink-300'}`}
                        >
                          {language}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-pink-500">Step 3</p>
                      <h2 className="mt-3 text-xl font-semibold">Write your story</h2>
                    </div>
                    <HeartPulse className="text-pink-500" size={26} />
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">A strong bio helps you match with people who share your energy.</p>
                </div>

                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Bio
                  <textarea
                    value={formData.bio}
                    onChange={(event) => setFormData({ ...formData, bio: event.target.value.slice(0, maxBio) })}
                    placeholder="Write a short, confident introduction about yourself"
                    rows={5}
                    className="mt-2 w-full rounded-[1.75rem] border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-500/20"
                  />
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{formData.bio.length}/{maxBio} characters</p>

                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {interestsOptions.map((interest) => {
                      const selected = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleItem('interests', interest)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${selected ? 'border-pink-500 bg-pink-500/10 text-pink-700' : 'border-zinc-300 bg-white text-zinc-700 hover:border-pink-500 hover:text-pink-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-pink-500 dark:hover:text-pink-300'}`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Lifestyle</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lifestyleOptions.map((option) => {
                      const selected = formData.lifestyle.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleItem('lifestyle', option)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${selected ? 'border-pink-500 bg-pink-500/10 text-pink-700' : 'border-zinc-300 bg-white text-zinc-700 hover:border-pink-500 hover:text-pink-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-pink-500 dark:hover:text-pink-300'}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {step === stepLabels.length ? 'Final step: review and launch your profile.' : 'Fill in the details to continue.'}
              </div>
              <div className="flex gap-3">
                {step > 1 && (
                  <Button variant="outline" className="h-12" type="button" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button type="button" className="h-12" onClick={handleNext} disabled={!stepValid || loading}>
                  {loading ? 'Finalizing…' : step === stepLabels.length ? 'Complete Setup' : 'Continue'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
