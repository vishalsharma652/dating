'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Share2, Flag } from 'lucide-react';
import { currentUser } from '@/lib/mockData';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              This is how other users see your profile
            </p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/user/profile/edit">
              <Edit2 size={18} />
              Edit Profile
            </Link>
          </Button>
        </div>

        {/* Photos */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentUser.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo})` }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</p>
              <p className="text-xl font-semibold">{currentUser.name}</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Age</p>
              <p className="text-xl font-semibold">{currentUser.age} years</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Location</p>
              <p className="text-xl font-semibold">{currentUser.location}</p>
            </div>
          </Card>
        </div>

        {/* Bio */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">About Me</h2>
            <p className="text-zinc-700 dark:text-zinc-300">{currentUser.bio}</p>
          </div>
        </Card>

        {/* Interests */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest) => (
                <Badge key={interest} variant="pink">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Verification Status */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Verification Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Profile Verified</span>
                {currentUser.verified && <Badge className="bg-green-500">✓ Verified</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span>KYC Status</span>
                <Badge className="bg-green-500">✓ {currentUser.kycStatus}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/user/profile/edit">
              <Edit2 size={18} />
              Edit Profile
            </Link>
          </Button>
          <Button variant="ghost" className="gap-2">
            <Share2 size={18} />
            Share Profile
          </Button>
          <Button variant="ghost" className="gap-2">
            <Flag size={18} />
            Report
          </Button>
        </div>
      </Container>
    </div>
  );
}
