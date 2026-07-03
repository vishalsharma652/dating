'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { currentUser } from '@/lib/mockData';
import { useState } from 'react';

export default function EditProfilePage() {
  const [interests, setInterests] = useState(currentUser.interests);
  const [newInterest, setNewInterest] = useState('');

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/user/profile">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        {/* Profile Picture */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex gap-4 items-end">
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <Button>Upload Photo</Button>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input value={currentUser.name} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <Input type="number" value={currentUser.age} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input value={currentUser.location} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                rows={4}
                value={currentUser.bio}
                className="w-full px-4 py-3 rounded-[1.75rem] border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20 text-sm transition resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">150 characters maximum</p>
            </div>
          </div>
        </Card>

        {/* Interests */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="pink"
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                  onClick={() =>
                    setInterests(interests.filter((i) => i !== interest))
                  }
                >
                  {interest}
                  <X size={14} />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add interest"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (newInterest && !interests.includes(newInterest)) {
                    setInterests([...interests, newInterest]);
                    setNewInterest('');
                  }
                }}
              >
                <Plus size={18} />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Verification Links */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Verification</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/user/profile/kyc">KYC Verification</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/user/profile/age-verify">Age Verification</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/user/profile/mobile-verify">Mobile Verification</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1">Save Changes</Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/user/profile">Cancel</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
