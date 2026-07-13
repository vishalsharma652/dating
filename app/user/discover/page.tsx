'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { DiscoverCard } from '@/components/user/discover-card';
import { AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [passedProfiles, setPassedProfiles] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfiles = () => {
    setLoading(true);
    setError('');
    userApi.discover()
      .then((data) => {
        setProfiles(data.profiles || []);
        setCurrentIndex(0);
        setPassedProfiles([]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profiles'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const currentProfile = profiles[currentIndex];
  const remainingProfiles = profiles.length - passedProfiles.length;

  const moveNext = async (action: 'like' | 'pass') => {
    if (!currentProfile) return;
    try {
      await userApi.reactToProfile(currentProfile.id, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save action');
      return;
    }
    setPassedProfiles([...passedProfiles, currentProfile.id]);
    setCurrentIndex(currentIndex + 1);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading profiles...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">You&apos;ve seen everyone!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Check back tomorrow for new profiles
            </p>
            <button
              onClick={loadProfiles}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:brightness-110 transition"
            >
              Refresh & Start Over
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <Container className="flex-1 flex flex-col">
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {currentIndex + 1} of {profiles.length} - {remainingProfiles} remaining
        </div>

        <AnimatePresence mode="wait" key={currentProfile.id}>
          <DiscoverCard
            key={currentProfile.id}
            profile={{ ...currentProfile, photo: currentProfile.photo || '/placeholder.svg', interests: currentProfile.interests || [] }}
            onLike={() => moveNext('like')}
            onPass={() => moveNext('pass')}
          />
        </AnimatePresence>
      </Container>
    </div>
  );
}
