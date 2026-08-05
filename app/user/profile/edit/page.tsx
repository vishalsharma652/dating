'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Upload, CheckCircle2, Clock, ShieldAlert, Sparkles, User, Heart, Shield, Camera } from 'lucide-react';

import { userApi, setAuthSession, getToken, apiAssetUrl } from '@/lib/api';
import { CameraCaptureModal } from '@/components/user/camera-capture-modal';

export default function EditProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', age: '', location: '', bio: '', photo: '/avatar-priya.jpg' });
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [gender, setGender] = useState('');
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);


  const uploadCapturedCameraPhoto = async (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    setMessage('');
    setError('');

    try {
      const data = await userApi.uploadPhoto(form);
      setFormData(prev => ({ ...prev, photo: apiAssetUrl(data.url) || data.url }));
      setMessage('Photo captured and uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadCapturedCameraPhoto(file);
    if (event.target) event.target.value = '';
  };

  useEffect(() => {
    userApi.profile()
      .then((data) => {
        const userGender = data.user?.gender || data.profile?.gender || '';
        setGender(userGender);
        const isFemale = userGender === 'female';
        const defaultPhoto = isFemale ? '/avatar-priya.jpg' : '/avatar-boy1.jpg';
        const photoVal = data.profile?.photos?.[0] 
          ? (apiAssetUrl(data.profile.photos[0]) || data.profile.photos[0]) 
          : (data.user?.photo || defaultPhoto);

        setFormData({
          name: data.user?.name || '',
          age: data.profile?.age ? String(data.profile.age) : '',
          location: data.profile?.city || '',
          bio: data.profile?.bio || '',
          photo: photoVal,
        });
        setKycStatus(data.user?.kyc_status || 'not_submitted');
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
        gender: gender || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        location: formData.location,
        bio: formData.bio,
        interests,
      });
      if (data.user) {
        setAuthSession(getToken() || '', data.user);
      }
      setMessage('Profile updated successfully.');
      setTimeout(() => {
        router.push('/user/profile');
      }, 500);
    } catch (err) {
      if (err instanceof Error) {
        const apiErr = err as any;
        if (apiErr.errors && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
          setError(apiErr.errors.map((e: any) => `${e.field}: ${e.message}`).join(', '));
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 bg-[#070B18] min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-[#070B18] text-white min-h-screen relative overflow-hidden">
      
      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#EC4899]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none" />

      <Container className="max-w-4xl relative z-10 space-y-8">
        
        {/* Back Link Header */}
        <div className="flex items-center gap-3.5 border-b border-white/5 pb-6">
          <Button variant="ghost" size="sm" className="rounded-xl border border-white/5 hover:bg-white/[0.03] text-zinc-300 h-9 px-3" asChild>
            <Link href="/user/profile">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-black text-white tracking-tight">Edit Profile</h1>
        </div>

        {/* Alert Notifications */}
        {message && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs font-semibold text-[#10B981]">
            <CheckCircle2 size={15} />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500">
            <ShieldAlert size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Picture Upload Section */}
        <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#EC4899]" />
          <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
            <Sparkles size={13} className="text-[#EC4899]" />
            <span>Profile Picture</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            <input type="file" ref={cameraInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*,video/*" capture="environment" />
            
            {/* Image Preview frame */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-[#070B18] shadow-inner relative group/img flex-shrink-0">
              <img 
                src={formData.photo} 
                alt={formData.name || 'Profile'} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="text-center sm:text-left space-y-2.5">
              <p className="text-xs font-bold text-zinc-300">Make a great first impression by adding a high-quality photo.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  type="button" 
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 rounded-xl border-0 shadow-md flex items-center gap-2 transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Take Live Photo</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Upload From Gallery</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <CameraCaptureModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={uploadCapturedCameraPhoto}
        />

        {/* Profile General Settings Card */}
        <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7C3AED]" />
          <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
            <User size={13} className="text-[#EC4899]" />
            <span>General Information</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Full Name</label>
                <Input 
                  value={formData.name} 
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 focus:border-[#EC4899] rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#EC4899]/20" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Age</label>
                <Input 
                  type="number" 
                  min="18"
                  max="100"
                  value={formData.age} 
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val !== '' && Number(val) < 0) return;
                    setFormData({ ...formData, age: val });
                  }}
                  className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 focus:border-[#EC4899] rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#EC4899]/20" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Location (City)</label>
              <Input 
                value={formData.location} 
                onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 focus:border-[#EC4899] rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#EC4899]/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-white placeholder-zinc-500 focus:border-[#EC4899] focus:outline-none focus:ring-1 focus:ring-[#EC4899]/20 text-xs font-semibold resize-none"
                placeholder="Write something about yourself..."
                maxLength={180}
              />
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[10px] text-zinc-500 font-bold">180 characters maximum</span>
                <span className="text-[10px] text-zinc-500 font-bold">{(formData.bio || '').length}/180</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Hobbies & Interests Card */}
        <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#EC4899]" />
          <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
            <Heart size={13} className="text-[#EC4899]" />
            <span>Interests & Hobbies</span>
          </h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-start">
              {interests.map((interest) => (
                <Badge 
                  key={interest} 
                  variant="pink" 
                  className="px-3.5 py-1.5 rounded-xl bg-[#EC4899]/10 border border-[#EC4899]/20 text-[10px] font-bold text-[#EC4899] flex items-center gap-2 hover:bg-[#EC4899]/15 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                  onClick={() => setInterests(interests.filter((i) => i !== interest))}
                >
                  <span>{interest}</span>
                  <X size={12} className="text-[#EC4899]/70 hover:text-[#EC4899]" />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Add hobbies e.g. Reading, Music" 
                value={newInterest} 
                onChange={(e) => setNewInterest(e.target.value)} 
                className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 focus:border-[#EC4899] rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#EC4899]/20 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  if (newInterest && !interests.includes(newInterest)) {
                    setInterests([...interests, newInterest]);
                    setNewInterest('');
                  }
                }}
                className="bg-[#EC4899]/10 hover:bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899] font-bold rounded-xl px-4 py-2.5 text-xs transition duration-300 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-0"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Verification Options Card */}
        <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md relative overflow-hidden group hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7C3AED]" />
          <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
            <Shield size={13} className="text-[#EC4899]" />
            <span>Verification Settings</span>
          </h3>
          
          <div>
            {kycStatus === 'approved' ? (
              <Button
                variant="outline"
                disabled
                className="w-full rounded-xl border-green-500/20 bg-green-500/10 text-green-400 font-bold py-3.5 h-11 flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
              >
                <CheckCircle2 size={16} className="text-green-500" />
                Done KYC (Verified ✓)
              </Button>
            ) : kycStatus === 'pending' ? (
              <Button
                variant="outline"
                disabled
                className="w-full rounded-xl border-yellow-500/20 bg-yellow-500/10 text-yellow-400 font-bold py-3.5 h-11 flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
              >
                <Clock size={16} className="text-yellow-500 animate-pulse" />
                KYC Submitted (Pending Review)
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-xl border-white/5 hover:border-white/10 text-zinc-300 hover:bg-white/[0.02] text-xs font-bold py-3.5 h-11 flex items-center justify-center gap-2 transition duration-300"
                asChild
              >
                <Link href="/user/profile/kyc">KYC Verification</Link>
              </Button>
            )}
          </div>
        </Card>



        {/* Page Save Trigger Actions */}
        <div className="flex gap-4">
          <Button 
            className="flex-1 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs tracking-wide uppercase py-3.5 border-0 shadow-md transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]" 
            onClick={save} 
            disabled={saving}
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl border-white/5 hover:border-white/10 text-zinc-300 hover:bg-white/[0.02] text-xs font-bold py-3.5 h-11.5 transition duration-300" 
            asChild
          >
            <Link href="/user/profile">Cancel</Link>
          </Button>
        </div>

      </Container>
    </div>
  );
}
