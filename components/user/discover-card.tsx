'use client';

import { motion } from 'framer-motion';
import { Heart, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiscoverCardProps {
  profile: any;
  onLike?: () => void;
  onPass?: () => void;
}

export function DiscoverCard({ profile, onLike, onPass }: DiscoverCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="relative h-screen md:h-[600px] rounded-2xl overflow-hidden group"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${profile.photo})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Badges */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {profile.verified && <Badge variant="pink">Verified</Badge>}
        <Badge variant="default">{profile.matchScore}% match</Badge>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <h2 className="text-4xl font-bold text-white mb-2">
          {profile.name}, {profile.age}
        </h2>
        <p className="text-white/90 mb-4">{profile.location}</p>

        {/* Interests */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.interests.map((interest: string) => (
            <Badge key={interest} variant="purple">
              {interest}
            </Badge>
          ))}
        </div>

        {/* Bio */}
        <p className="text-white/80 mb-6 line-clamp-2">{profile.bio}</p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full w-16 h-16 hover:bg-white/20"
            onClick={onPass}
          >
            <X className="text-white" size={28} />
          </Button>
          <Button
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={onLike}
          >
            <Heart className="fill-white text-white" size={28} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full w-16 h-16 hover:bg-white/20"
          >
            <Star className="text-white" size={28} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
