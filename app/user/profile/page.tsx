'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Share2, Flag } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function ProfilePage() {
  const [data, setData] = useState<{ user: any; profile: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.profile()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const user = data?.user || {};
  const profile = data?.profile || {};
  const photos = profile.photos?.length ? profile.photos : ['/placeholder.svg'];
  const interests = profile.interests || [];

  return (
    <div className="p-4 md:p-8">
      <Container>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-zinc-600 dark:text-zinc-400">This is how other users see your profile</p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/user/profile/edit">
              <Edit2 size={18} />
              Edit Profile
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo: string, index: number) => (
                <div key={index} className="aspect-square rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
              ))}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card><div className="p-6"><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</p><p className="text-xl font-semibold">{user.name || 'Not set'}</p></div></Card>
          <Card><div className="p-6"><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Age</p><p className="text-xl font-semibold">{profile.age || 'Not set'}</p></div></Card>
          <Card><div className="p-6"><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Location</p><p className="text-xl font-semibold">{profile.city || 'Not set'}</p></div></Card>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">About Me</h2>
            <p className="text-zinc-700 dark:text-zinc-300">{profile.bio || 'No bio added yet.'}</p>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.length === 0 && <span className="text-sm text-zinc-500">No interests added.</span>}
              {interests.map((interest: string) => <Badge key={interest} variant="pink">{interest}</Badge>)}
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Verification Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Profile Verified</span>
                <Badge className={user.status === 'active' ? 'bg-green-500' : ''}>{user.status || 'pending'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>KYC Status</span>
                <Badge className={user.kyc_status === 'approved' ? 'bg-green-500' : ''}>{user.kyc_status || 'pending'}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" asChild><Link href="/user/profile/edit"><Edit2 size={18} />Edit Profile</Link></Button>
          <Button variant="ghost" className="gap-2"><Share2 size={18} />Share Profile</Button>
          <Button variant="ghost" className="gap-2"><Flag size={18} />Report</Button>
        </div>
      </Container>
    </div>
  );
}
