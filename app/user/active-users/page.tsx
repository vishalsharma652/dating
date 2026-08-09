'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Search, ArrowLeft, Users, Clock, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import Loading from '@/app/loading';
import { SayHiModal } from '@/components/user/say-hi-modal';

function ActiveUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramFilter = searchParams.get('filter');

  const [data, setData] = useState<any>(null);
  const [existingChatUserIds, setExistingChatUserIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(paramFilter || 'all');
  const [sayHiTarget, setSayHiTarget] = useState<any>(null);

  // Keep activeFilter in sync if searchParams change
  useEffect(() => {
    if (paramFilter) {
      setActiveFilter(paramFilter);
    }
  }, [paramFilter]);

  useEffect(() => {
    Promise.all([
      userApi.dashboard(),
      userApi.chats().catch(() => ({ chats: [] }))
    ])
      .then(([dashRes, chatsRes]) => {
        setData(dashRes);
        const ids = new Set<number>(
          (chatsRes?.chats || []).map((c: any) => Number(c.userId || c.user_id || c.id))
        );
        setExistingChatUserIds(ids);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]">
      <Loading />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500 bg-[#070B18] min-h-screen flex items-center justify-center">
      {error}
    </div>
  );

  const user = data?.user || {};
  // Master list contains all registered users
  const allMasterUsers = (data?.allUsers && Array.isArray(data.allUsers) && data.allUsers.length > 0)
    ? data.allUsers
    : (data?.activeUsers || data?.activeGirls || []);

  const userGender = String(user.gender || user.role || '').toLowerCase();
  const isUserMale = ['male', 'man', 'boy', 'men'].includes(userGender);
  const isUserFemale = ['female', 'woman', 'girl', 'women'].includes(userGender);
  const targetLabel = isUserFemale ? 'Active Males' : (userGender === 'male' ? 'Active Females' : 'Active Users');
  const allTargetLabel = isUserFemale ? 'All Males' : (isUserMale ? 'All Females' : 'All Users');

  const girlFallbacks = ['/avatar-priya.jpg', '/avatar-ananya.jpg', '/avatar-neha.jpg', '/avatar-riya.jpg'];
  const boyFallbacks = ['/avatar-boy1.jpg', '/avatar-boy2.jpg', '/avatar-boy3.jpg', '/avatar-boy4.jpg'];

  const formattedUsers = allMasterUsers.map((u: any, idx: number) => {
    const isTargetFemale = ['female', 'woman', 'girl', 'women'].includes(String(u.gender || '').toLowerCase());
    const userFallbackPhotos = isTargetFemale ? girlFallbacks : boyFallbacks;
    const photoUrl = (u.photo && String(u.photo).trim() !== '') ? u.photo : userFallbackPhotos[idx % userFallbackPhotos.length];

    const isOnline = u.online == true || u.isOnline == true || u.online_status == true || u.online === 1 || u.online === '1' || String(u.status || '').toLowerCase() === 'online';

    return {
      id: u.id,
      isTargetFemale,
      uniqueId: String(u.unique_id || u.uniqueId || u.id || '').replace(/^STK-/i, '').padStart(6, '0'),
      name: u.name || 'User',
      age: u.age || null,
      location: u.location || u.city || '',
      status: isOnline ? 'Online' : 'Offline',
      kycStatus: u.kyc_status || (u.verified ? 'approved' : 'pending'),
      isVerified: Boolean((u.kyc_status || u.kycStatus) === 'approved' || u.verified === true || u.verified === 1 || u.verified === '1'),
      photo: photoUrl,
      bio: u.bio || 'Looking for meaningful connections'
    };
  });

  const filteredUsers = formattedUsers.filter((u: any) => {
    // 0. Gender Filter: Male user sees ONLY Female members, Female user sees ONLY Male members
    if (isUserMale && !u.isTargetFemale) return false;
    if (isUserFemale && u.isTargetFemale) return false;

    // 1. Tab filter
    if (activeFilter === 'new') {
      if (u.kycStatus === 'approved') return false;
    } else if (activeFilter === 'verified') {
      if (u.kycStatus !== 'approved') return false;
    } else if (activeFilter === 'active') {
      if (u.status !== 'Online') return false;
    }

    // 2. Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.name.toLowerCase().includes(query) ||
      u.location.toLowerCase().includes(query) ||
      u.uniqueId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-8 bg-[#070B18] text-white min-h-screen relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#EC4899]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none" />

      <Container className="max-w-7xl relative z-10 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/user/dashboard"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            >
              <ArrowLeft size={18} className="text-zinc-300" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Users size={24} className="text-[#EC4899]" />
                <span>
                  {activeFilter === 'all'
                    ? allTargetLabel
                    : activeFilter === 'new'
                    ? 'New Users'
                    : activeFilter === 'verified'
                    ? 'Verified Users'
                    : targetLabel}
                </span>
              </h1>
              <p className="text-zinc-400 text-sm font-medium mt-1">
                Showing {filteredUsers.length} members
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Name, City or Unique ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#101827]/80 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#EC4899]/50 transition"
            />
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap items-center gap-6">
          {[
            { id: 'all', label: allTargetLabel, icon: Users },
            { id: 'new', label: 'New Users', icon: Clock },
            { id: 'verified', label: 'Verified Users', icon: ShieldCheck },
            { id: 'active', label: targetLabel, icon: Heart },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? 'bg-[#EC4899] border-[#EC4899] text-white shadow-lg shadow-pink-500/20'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Cards Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EC4899]/10 border border-[#EC4899]/20 flex items-center justify-center mx-auto text-[#EC4899]">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">No members found</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              We couldn't find any users matching your filter or search criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              className="rounded-full border-white/10 text-xs"
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.map((u: any) => (
              <Card
                key={u.id}
                className="bg-[#0D1424]/90 border border-white/10 rounded-[24px] p-4 hover:border-[#EC4899]/50 hover:-translate-y-1.5 transition-all duration-300 relative group flex flex-col justify-between shadow-xl overflow-hidden"
              >
                {/* Portrait Photo */}
                <div className="relative aspect-[3/4] rounded-[18px] overflow-hidden mb-3.5 shadow-inner">
                  <img
                    src={u.photo}
                    alt={u.name}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                  {/* Top Right Blue Tick Icon */}
                  {u.isVerified && (
                    <div
                      className="absolute top-1 right-1 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.6)] border border-white/40 backdrop-blur-md"
                    >
                      <CheckCircle2 size={15} className="fill-white text-[#3B82F6]" />
                    </div>
                  )}

                  {/* Heart Action Badge - Bottom Right */}
                  <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#7C3AED] text-white flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 transition duration-300">
                    <Heart size={14} className="fill-current text-white" />
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="space-y-2 text-left px-1 pb-1">
                  {/* Line 1: Full Name */}
                  <h3 className="font-black text-lg text-white truncate leading-tight group-hover:text-[#EC4899] transition-colors" title={u.name}>
                    {u.name}
                  </h3>

                  {/* Line 2: Age & Location */}
                  <p className="text-xs font-semibold text-zinc-400 truncate">
                    {u.age ? `${u.age} yrs` : ''}{u.age && u.location ? ' • ' : ''}{u.location ? `📍 ${u.location}` : ''}
                  </p>

                  {/* Line 3: Online Status & Unique ID */}
                  <div className="flex items-center justify-between gap-1 pt-2.5 border-t border-white/5">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${u.status === 'Online' ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-zinc-500'}`} />
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${u.status === 'Online' ? 'text-[#10B981]' : 'text-zinc-400'}`}>
                        {u.status === 'Online' ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 shadow-sm whitespace-nowrap">
                      {u.uniqueId}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    if (existingChatUserIds.has(Number(u.id))) {
                      router.push(`/user/chat/${u.id}`);
                    } else {
                      setSayHiTarget({ id: u.id, name: u.name, photo: u.photo, location: u.location });
                    }
                  }}
                  className="w-full mt-3.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5 shadow-md border-0 cursor-pointer"
                >
                  <Sparkles size={14} className="text-white" />
                  <span>Say Hi 👋</span>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Container>

      <SayHiModal
        isOpen={Boolean(sayHiTarget)}
        onClose={() => setSayHiTarget(null)}
        targetUser={sayHiTarget}
        currentCoins={user?.coins}
      />
    </div>
  );
}

export default function ActiveUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]"><Loading /></div>}>
      <ActiveUsersContent />
    </Suspense>
  );
}
