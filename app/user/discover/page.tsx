'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { DiscoverCard } from '@/components/user/discover-card';
import { AnimatePresence } from 'framer-motion';
import { profiles } from '@/lib/mockData';

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);

  const currentProfile = profiles[currentIndex];
  const remainingProfiles = profiles.length - passedProfiles.length;

  const handlePass = () => {
    setPassedProfiles([...passedProfiles, currentProfile.id]);
    setCurrentIndex(currentIndex + 1);
  };

  const handleLike = () => {
    alert(`You liked ${currentProfile.name}! 💕`);
    setPassedProfiles([...passedProfiles, currentProfile.id]);
    setCurrentIndex(currentIndex + 1);
  };

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">You've seen everyone!</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Check back tomorrow for new profiles
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setPassedProfiles([]);
              }}
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
          {currentIndex + 1} of {profiles.length} • {remainingProfiles} remaining
        </div>

        <AnimatePresence mode="wait" key={currentProfile.id}>
          <DiscoverCard
            key={currentProfile.id}
            profile={currentProfile}
            onLike={handleLike}
            onPass={handlePass}
          />
        </AnimatePresence>
      </Container>
    </div>
  );
}
