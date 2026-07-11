'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { userApi, setAuthSession, getToken, apiAssetUrl } from '@/lib/api';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({ name: '', age: '', location: '', bio: '', photo: '/placeholder.svg' });
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('photo', file);
    setMessage('');
    setError('');

    try {
      const data = await userApi.uploadPhoto(form);
      setFormData(prev => ({ ...prev, photo: apiAssetUrl(data.url) || data.url }));
      setMessage('Photo uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo');
    }
  };

  useEffect(() => {
    userApi.profile()
      .then((data) => {
        setFormData({
          name: data.user?.name || '',
          age: data.profile?.age ? String(data.profile.age) : '',
          location: data.profile?.city || '',
          bio: data.profile?.bio || '',
          photo: data.profile?.photos?.[0] ? (apiAssetUrl(data.profile.photos[0]) || data.profile.photos[0]) : '/placeholder.svg',
        });
        setInterests(data.profile?.interests || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await userApi.updateProfile({
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        location: formData.location,
        bio: formData.bio,
        interests,
      });
      if (data.user) {
        setAuthSession(getToken() || '', data.user);
      }
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading profile...</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/user/profile"><ArrowLeft size={18} /></Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        {message && <p className="mb-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600">{message}</p>}
        {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex gap-4 items-end">
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              <img src={formData.photo} alt={formData.name || 'Profile'} className="w-24 h-24 rounded-lg object-cover" />
              <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <Input type="number" value={formData.age} onChange={(event) => setFormData({ ...formData, age: event.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                className="w-full px-4 py-3 rounded-[1.75rem] border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20 text-sm transition resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">180 characters maximum</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map((interest) => (
                <Badge key={interest} variant="pink" className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => setInterests(interests.filter((i) => i !== interest))}>
                  {interest}
                  <X size={14} />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input placeholder="Add interest" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} />
              <Button
                type="button"
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

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Verification</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild><Link href="/user/profile/kyc">KYC Verification</Link></Button>
              <Button variant="outline" className="w-full justify-start" asChild><Link href="/user/profile/age-verify">Age Verification</Link></Button>
              <Button variant="outline" className="w-full justify-start" asChild><Link href="/user/profile/mobile-verify">Mobile Verification</Link></Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button className="flex-1" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          <Button variant="outline" className="flex-1" asChild><Link href="/user/profile">Cancel</Link></Button>
        </div>
      </Container>
    </div>
  );
}
