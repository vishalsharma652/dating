'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit2,
  Share2,
  Flag,
  Heart,
  Sparkles,
  Shield,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Sparkle,
  TrendingUp,
  Eye,
  Lock,
  Compass,
  ArrowUpRight,
  Fingerprint,
  Copy
} from 'lucide-react';
import { userApi, apiAssetUrl } from '@/lib/api';
import Loading from '@/app/loading';


export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<{ user: any; profile: any } | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    userApi.profile()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'))
      .finally(() => setLoading(false));

    userApi.matches()
      .then((res) => {
        setMatchesCount(res.matches?.length || 0);
      })
      .catch(() => undefined);
  }, []);

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="space-y-3">
        <Loading />
      </div>
    </div>
  );

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-[#070B18] min-h-screen flex items-center justify-center">{error}</div>;
  }

  const user = data?.user || {};
  const profile = data?.profile || {};
  const isFemale = user.gender === 'female';
  const defaultProfileAvatar = isFemale ? '/avatar-priya.jpg' : '/avatar-boy1.jpg';

  const photos = profile.photos?.length
    ? profile.photos.map((p: string) => apiAssetUrl(p) || p)
    : [user.photo || defaultProfileAvatar];

  const interests = profile.interests || [];

  const calculateProfileStrength = (usr: any, prof: any) => {
    let score = 20; // Base registration score
    if (usr.photo || prof.photos?.length) score += 20;
    if (prof.bio) score += 20;
    if (usr.status === 'active') score += 15;
    if (usr.kyc_status === 'approved') score += 15;
    if (prof.interests?.length >= 3) score += 10;
    return score;
  };

  const profileStrength = calculateProfileStrength(user, profile);

  return (
    <div className="p-4 md:p-8 bg-[#070B18] text-white min-h-screen relative overflow-hidden">

      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#EC4899]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none" />

      <Container className="max-w-7xl relative z-10 space-y-8">

        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              My Profile <Sparkle size={20} className="text-[#EC4899] fill-[#EC4899] animate-pulse" />
            </h1>
            <p className="text-zinc-400 text-sm font-semibold">
              This is how other users see your profile
            </p>
            {/* Unique ID Badge — only shown after KYC approved */}
            {user.unique_id && (
              <button
                type="button"
                title="Click to copy your Unique ID"
                onClick={() => {
                  navigator.clipboard.writeText(user.unique_id);
                  setMessage('Unique ID copied to clipboard!');
                  setTimeout(() => setMessage(''), 2000);
                }}
                className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#10B981]/15 to-[#6366f1]/15 border border-[#10B981]/30 hover:border-[#10B981]/60 transition-all duration-200 cursor-pointer group"
              >
                <Fingerprint size={13} className="text-[#10B981]" />
                <span className="text-[11px] font-black text-[#10B981] tracking-widest uppercase">Your ID: {user.unique_id}</span>
                <Copy size={11} className="text-[#10B981]/60 group-hover:text-[#10B981] transition" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Profile Strength Meter */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" className="text-white/5" strokeWidth="2" fill="transparent" />
                  <circle cx="16" cy="16" r="14" stroke="currentColor" className="text-[#EC4899]" strokeWidth="2" fill="transparent"
                    strokeDasharray={88} strokeDashoffset={88 - (88 * profileStrength) / 100} />
                </svg>
                <span className="absolute text-[8px] font-black text-white">{profileStrength}%</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Profile Strength</p>
                <p className="text-[9px] font-bold text-[#EC4899]">Excellent Match Potential 🚀</p>
              </div>
            </div>

            <Button
              className="rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 flex items-center gap-2 border-0 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              asChild
            >
              <Link href="/user/profile/edit">
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Alert Notifications */}
        {message && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs font-semibold text-[#10B981] animate-fade-in shadow-md">
            <CheckCircle2 size={15} />
            <span>{message}</span>
          </div>
        )}

        {/* Full-Width Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Tinder Preview + Analytics + Safety Tips (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Tinder-style Profile Preview Card */}
            <Card className="bg-[#101827]/72 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group relative transition-all duration-500 hover:border-white/10 hover:shadow-[0_0_50px_rgba(236,72,153,0.12)]">
              {/* Photo Area */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={photos[0]}
                  alt={user.name}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-102"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070B18] via-transparent to-black/30" />

                {/* Status online badge / premium pill overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EC4899]/20 border border-[#EC4899]/30 text-[9px] font-black text-[#EC4899] uppercase tracking-wider select-none shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                  <Sparkles size={10} className="fill-[#EC4899]" />
                  <span>Premium Member</span>
                </div>

                {/* Verification Overlay Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-[9px] font-black text-[#10B981] uppercase tracking-wider select-none shadow-sm">
                  <CheckCircle2 size={10} className="fill-[#10B981] text-black" />
                  <span>Verified</span>
                </div>

                {/* Profile Details Overlay at the bottom */}
                <div className="absolute bottom-6 left-6 right-6 text-left space-y-1.5 z-10">
                  <div className="flex items-baseline gap-2.5">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-[#EC4899] tracking-tight">{user.name || 'User'}</h2>
                    <span className="text-xl font-bold text-zinc-300">{profile.age}</span>
                  </div>
                  {profile.city && (
                    <div className="flex items-center gap-1 text-zinc-350 text-xs font-semibold">
                      <MapPin size={11} className="text-[#EC4899]" />
                      {profile.city ? `${profile.city}, India` : ""}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Active Now</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Performance Analytics Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md space-y-4">
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={13} className="text-[#EC4899]" />
                <span>Match Performance</span>
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                  <Eye size={12} className="text-zinc-400 mx-auto mb-1" />
                  <p className="text-sm font-black text-white">{profile.views || 0}</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Views</p>
                  <span className="text-[8px] font-black text-[#10B981] mt-0.5 inline-block">+12%</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                  <Heart size={12} className="text-zinc-400 mx-auto mb-1" />
                  <p className="text-sm font-black text-white">{profile.likesCount || 0}</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Likes</p>
                  <span className="text-[8px] font-black text-[#10B981] mt-0.5 inline-block">+8%</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5">
                  <Sparkles size={12} className="text-zinc-400 mx-auto mb-1" />
                  <p className="text-sm font-black text-white">{matchesCount}</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Matches</p>
                  <span className="text-[8px] font-black text-[#7C3AED] mt-0.5 inline-block">+24%</span>
                </div>
              </div>
            </Card>

            {/* Dating Safety Checklist Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-md space-y-3.5 text-left">
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider flex items-center gap-2">
                <Lock size={13} className="text-[#EC4899]" />
                <span>Dating Safety Tips</span>
              </h3>
              <div className="space-y-2.5 text-[11px] font-semibold text-zinc-400 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] mt-1.5 flex-shrink-0" />
                  <span>Never share your password, OTP, or financial details.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] mt-1.5 flex-shrink-0" />
                  <span>Keep chats on Saathika until you are confident of verification.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] mt-1.5 flex-shrink-0" />
                  <span>Always plan first meetings in well-lit public spaces.</span>
                </p>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: Details & Action items (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Single Dedicated About Me Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#EC4899]" />
              <div>
                <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-3.5 flex items-center gap-2">
                  <User size={13} className="text-[#EC4899]" />
                  <span>About Me</span>
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed font-semibold text-left">
                  {profile.bio || 'No bio added yet. Tell people about your interests and dreams by editing your profile!'}
                </p>
              </div>
            </Card>

            {/* Profile Completion Checklist */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED]" />
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <Compass size={13} className="text-[#7C3AED]" />
                <span>Optimization Checklist</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold text-left">
                <div className="flex items-center gap-2">
                  {profile.photos?.length >= 3 ? (
                    <CheckCircle2 size={12} className="text-[#10B981] flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={profile.photos?.length >= 3 ? 'text-zinc-400 line-through' : 'text-zinc-300'}>Upload 3+ Photos (+20%)</span>
                </div>

                <div className="flex items-center gap-2">
                  {interests.length >= 3 ? (
                    <CheckCircle2 size={12} className="text-[#10B981] flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={interests.length >= 3 ? 'text-zinc-400 line-through' : 'text-zinc-300'}>Select 3+ Interests (+20%)</span>
                </div>

                <div className="flex items-center gap-2">
                  {user.status === 'active' ? (
                    <CheckCircle2 size={12} className="text-[#10B981] flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className={user.status === 'active' ? 'text-zinc-400 line-through' : 'text-zinc-300'}>Email Verified (+30%)</span>
                </div>

                <div className="flex items-center gap-2">
                  {user.kyc_status === 'approved' ? (
                    <CheckCircle2 size={12} className="text-[#10B981] flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-[#EC4899] flex-shrink-0" />
                  )}
                  <span className={user.kyc_status === 'approved' ? 'text-zinc-400 line-through' : 'text-[#EC4899]'}>KYC ID Verification (+30%)</span>
                </div>
              </div>
            </Card>

            {/* Hobbies & Interests Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6.5 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#EC4899]" />
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
                <Heart size={14} className="text-[#EC4899]" />
                <span>Interests & Hobbies</span>
              </h3>
              <div className="flex flex-wrap gap-2.5 justify-start">
                {interests.length === 0 ? (
                  <span className="text-xs text-zinc-400 font-semibold">No interests selected.</span>
                ) : (
                  interests.map((interest: string) => (
                    <Badge
                      key={interest}
                      variant="pink"
                      className="px-4 py-2 rounded-xl bg-[#EC4899]/10 border border-[#EC4899]/20 text-[11px] font-bold text-[#EC4899] hover:bg-[#EC4899]/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                    >
                      {interest}
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            {/* Photos Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED]" />
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
                <Sparkles size={14} className="text-[#EC4899]" />
                <span>My Photos</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
                {/* Left Side: Single Portrait Photo */}
                <div
                  className="w-40 aspect-[3/4] rounded-[20px] overflow-hidden border border-white/10 hover:border-[#EC4899]/30 transition duration-300 relative group bg-[#070B18] shadow-lg cursor-pointer flex-shrink-0"
                >
                  <img
                    src={photos[0]}
                    alt="Current Profile Cover"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                </div>

                {/* Right Side: Photo Insights / Guidelines to fill space */}
                <div className="flex-1 flex flex-col justify-between text-left space-y-4 py-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">Active Cover Photo</span>
                    </div>
                    <h4 className="text-sm font-black text-white">Your Primary Profile Image</h4>
                    <p className="text-[11px] font-semibold text-zinc-400 leading-relaxed">
                      This photo is displayed on discover cards and swiping queues. Ensure your face is clearly visible to get maximum match performance.
                    </p>
                  </div>

                  <div className="space-y-2.5 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                    <h5 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Photo Quality Tips</h5>
                    <div className="space-y-1.5 text-[11px] font-semibold text-zinc-400">
                      <p className="flex items-center gap-2">
                        <span className="text-[#EC4899] font-bold">✓</span>
                        <span>Good lighting & high resolution</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-[#EC4899] font-bold">✓</span>
                        <span>Friendly expression & clear face view</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Checklist Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6.5 shadow-[0_20px_45px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#EC4899]" />
              <h3 className="font-bold text-white tracking-tight text-xs uppercase tracking-wider mb-5 flex items-center gap-2">
                <Shield size={14} className="text-[#EC4899]" />
                <span>Verification Checklist</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#10B981]" />
                    <span className="text-xs font-bold text-white">Profile Security</span>
                  </div>
                  <Badge className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.status === 'active'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                    : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                    {user.status || 'pending'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    {user.kyc_status === 'approved' ? (
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    ) : (
                      <Clock size={16} className="text-yellow-500" />
                    )}
                    <span className="text-xs font-bold text-white">Identity KYC</span>
                  </div>
                  <Badge className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.kyc_status === 'approved'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                    : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                    {user.kyc_status || 'pending'}
                  </Badge>
                </div>
              </div>

              {/* Unique ID display — shown after KYC approval */}
              {user.unique_id && (
                <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#10B981]/10 to-[#6366f1]/10 border border-[#10B981]/20">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={16} className="text-[#10B981]" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Unique ID</p>
                      <p className="text-sm font-black text-white tracking-widest">{user.unique_id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(user.unique_id); setMessage('Unique ID copied!'); setTimeout(() => setMessage(''), 2000); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-black uppercase tracking-wider hover:bg-[#10B981]/25 transition-all"
                  >
                    <Copy size={11} />
                    Copy ID
                  </button>
                </div>
              )}
            </Card>

            {/* Profile Action Buttons & Premium Boost Banner */}
            <div className="space-y-6">

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-4 justify-start">
                <Button
                  variant="outline"
                  className="rounded-xl border-[#EC4899]/30 hover:border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899]/5 text-xs font-bold px-6 py-2.5 h-11.5 flex items-center gap-2 transition duration-300"
                  asChild
                >
                  <Link href="/user/profile/edit">
                    <Edit2 size={14} />
                    <span>Edit Details</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/5 hover:border-white/10 text-zinc-300 hover:bg-white/[0.02] text-xs font-bold px-6 py-2.5 h-11.5 flex items-center gap-2 transition duration-300"
                >
                  <Share2 size={14} />
                  <span>Share Profile</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/5 hover:border-white/10 text-red-400 hover:bg-red-500/5 text-xs font-bold px-6 py-2.5 h-11.5 flex items-center gap-2 transition duration-300 ml-auto md:ml-0"
                >
                  <Flag size={14} />
                  <span>Report</span>
                </Button>
              </div>

            </div>

          </div>

        </div>

      </Container>
    </div>
  );
}
