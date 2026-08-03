'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  Circle,
  Bell,
  Sparkles,
  Coins,
  PenSquare,
  CheckCircle2,
  Clock,
  Eye,
  Shield,
  Search,
  BadgeIndianRupee,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import Loading from '@/app/loading';

export default function DashboardPage() {
  const [data, setData] = useState<{
    user: any;
    profile: any;
    matches: any[];
    activeUsers: any[];
    assignedUser: any | null;
    activeLabel: string;
    activeGirls?: any[];
    assignedGirl?: any | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    userApi.dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard'))
      .finally(() => setLoading(false));

    userApi.chats()
      .then((res) => {
        const sum = (res.chats || []).reduce((acc: number, c: any) => acc + (Number(c.unreadCount) || 0), 0);
        setUnreadMessages(sum);
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
  const matches = data?.matches || [];
  const activeUsers = data?.activeUsers || data?.activeGirls || [];

  const userGender = String(user.gender || user.role || '').toLowerCase();
  const isFemale = ['female', 'woman', 'girl', 'women'].includes(userGender);
  const targetLabel = isFemale ? 'Active Boys' : (userGender === 'male' ? 'Active Girls' : 'Active Users');

  const girlFallbacks = ['/avatar-priya.jpg', '/avatar-ananya.jpg', '/avatar-neha.jpg', '/avatar-riya.jpg'];
  const boyFallbacks = ['/avatar-boy1.jpg', '/avatar-boy2.jpg', '/avatar-boy3.jpg', '/avatar-boy4.jpg'];
  const fallbacks = isFemale ? boyFallbacks : girlFallbacks;
  const defaultHeaderAvatar = isFemale ? '/avatar-priya.jpg' : '/avatar-boy1.jpg';

  const activeGirlsList = activeUsers.slice(0, 4).map((u: any, idx: number) => ({
    id: u.id,
    uniqueId: u.unique_id || u.uniqueId || `STK-${String(u.id).padStart(6, '0')}`,
    name: u.name || 'User',
    age: u.age || 24,
    location: u.location || 'Delhi',
    status: u.isOnline !== false ? 'Online' : 'Away',
    photo: u.photo || fallbacks[idx % fallbacks.length]
  }));

  return (
    <div className="p-4 md:p-8 bg-[#070B18] text-white min-h-screen space-y-8 relative overflow-hidden">

      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#EC4899]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none" />

      <Container className="max-w-7xl relative z-10 space-y-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              Welcome back, {user.name || 'User'}! 👋
            </h1>
            <p className="text-zinc-400 text-sm font-medium mt-1">
              Here's what's happening with your dating journey
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4.5">
            {/* Premium Pill */}
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#EC4899]/10 border border-[#EC4899]/20 text-[10px] font-bold text-[#EC4899] tracking-wider uppercase select-none shadow-[0_0_15px_rgba(236,72,153,0.15)]">
              <Sparkles size={11} className="fill-[#EC4899]" />
              <span>Premium Member</span>
            </div>

            {/* Notification Bell */}
            <Link
              href="/user/notifications"
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center relative hover:bg-white/[0.08] transition duration-300"
            >
              <Bell size={16} className="text-zinc-300" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#EC4899] border-2 border-[#070B18]" />
            </Link>

            {/* Profile Avatar */}
            <Link
              href="/user/profile"
              className="w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-[#EC4899]/30 transition duration-300"
            >
              <img
                src={user.photo || defaultHeaderAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: 'Total Matches',
              value: matches.length || 0,
              icon: Heart,
              change: '0 recent',
              color: '#EC4899',
              chartColor: '#EC4899'
            },
            {
              label: 'New Messages',
              value: unreadMessages,
              icon: MessageCircle,
              change: 'Synced from chats',
              color: '#7C3AED',
              chartColor: '#7C3AED'
            },
            {
              label: targetLabel,
              value: activeGirlsList.filter(g => g.status === 'Online').length,
              icon: Users,
              change: 'Waiting for online users',
              color: '#EC4899',
              chartColor: '#EC4899'
            },
            {
              label: 'Coins Balance',
              value: user.coins !== undefined ? user.coins : 0,
              icon: Coins,
              change: 'View wallet',
              isLink: true,
              color: '#7C3AED',
              chartColor: '#7C3AED'
            }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card
                key={i}
                className="relative bg-[#101827]/72 backdrop-blur-xl border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-white/10 transition-all duration-300 group shadow-md"
              >
                {/* Background Glow */}
                <div
                  className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-xl opacity-10 pointer-events-none group-hover:opacity-15 transition-opacity"
                  style={{ backgroundColor: stat.color }}
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    {/* Glowing Icon Container */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                    >
                      <Icon size={20} style={{ color: stat.color, filter: `drop-shadow(0 0 6px ${stat.color}aa)` }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-zinc-450 tracking-wide uppercase">{stat.label}</p>
                    <h3 className="text-3xl font-black text-white mt-1 leading-none tracking-tight">
                      {stat.value}
                    </h3>
                  </div>

                  <div className="text-[11px] font-bold">
                    {stat.isLink ? (
                      <Link href="/user/wallet" className="text-[#7C3AED] hover:underline flex items-center gap-1">
                        <span>{stat.change}</span>
                        <span>→</span>
                      </Link>
                    ) : (
                      <span className="text-[#10B981]">{`↑ ${stat.change}`}</span>
                    )}
                  </div>
                </div>

                {/* Mini SVG line graph path */}
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d={i % 2 === 0
                        ? "M0,25 Q15,10 30,20 T60,5 T90,22 T100,10 L100,30 L0,30 Z"
                        : "M0,22 Q10,25 25,12 T50,24 T75,8 T100,20 L100,30 L0,30 Z"}
                      fill={`url(#grad-${i})`}
                    />
                    <path
                      d={i % 2 === 0
                        ? "M0,25 Q15,10 30,20 T60,5 T90,22 T100,10"
                        : "M0,22 Q10,25 25,12 T50,24 T75,8 T100,20"}
                      fill="none"
                      stroke={stat.chartColor}
                      strokeWidth="1.2"
                    />
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.chartColor} />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Grid: Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: Active Girls */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 md:p-8 space-y-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)]">

              {/* Box Header */}
              <div className="flex justify-between items-center pb-2">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Heart size={18} className="text-[#EC4899]" />
                  <span>{targetLabel}</span>
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#EC4899]/30 hover:border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899]/5 text-xs px-4"
                  asChild
                >
                  <Link href="/user/discover">View All</Link>
                </Button>
              </div>

              {/* Profiles Grid */}
              {activeGirlsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 relative overflow-hidden rounded-[20px] bg-white/[0.01] border border-white/5 p-8">
                  {/* Concentric Pulsing Radar Rings */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#EC4899]/5 animate-ping duration-1000" />
                    <div className="absolute inset-3 rounded-full bg-[#7C3AED]/8 animate-ping duration-1000" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute inset-6 rounded-full bg-[#EC4899]/12 animate-ping duration-1000" style={{ animationDelay: '0.6s' }} />

                    {/* Glowing Heart Locator */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#7C3AED] flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] relative z-10">
                      <Heart size={18} className="fill-current animate-pulse text-white" />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-sm relative z-10">
                    <h3 className="font-bold text-white text-sm tracking-tight">Scanning for connections...</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-semibold">
                      No active {isFemale ? 'boys' : 'girls'} are online right now. We are constantly searching. Check back soon or boost your profile to increase your views!
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold rounded-full px-6 py-2.5 text-xs transition duration-300 relative z-10 shadow-[0_4px_12px_rgba(236,72,153,0.2)] border-0"
                    asChild
                  >
                    <Link href="/user/discover">Boost My Visibility</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4.5">
                    {activeGirlsList.map((girl) => (
                      <Link
                        key={girl.id}
                        href={`/user/chat/${girl.id}`}
                        className="group relative bg-[#0D1322] border border-white/10 rounded-[24px] overflow-hidden hover:border-[#EC4899]/50 hover:shadow-[0_15px_35px_rgba(236,72,153,0.2)] transition-all duration-500 flex flex-col justify-between"
                      >
                        {/* Main Image Container */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          {/* Background Image */}
                          <img
                            src={girl.photo}
                            alt={girl.name}
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                          />

                          {/* Dark Vignette Gradients */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-black/20 to-black/60 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                            {/* Unique ID Badge */}
                            <div className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-400 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                              <span>{girl.uniqueId}</span>
                            </div>

                            {/* Online / Away Status Pill */}
                            <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                              girl.status === 'Online'
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${girl.status === 'Online' ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-amber-400'}`} />
                              <span>{girl.status}</span>
                            </div>
                          </div>

                          {/* Bottom Content Overlay */}
                          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
                            <div className="space-y-0.5 max-w-[70%] text-left">
                              <h3 className="font-black text-base text-white truncate drop-shadow-md leading-tight group-hover:text-[#EC4899] transition-colors">
                                {girl.name}, <span className="font-extrabold text-sm text-zinc-300">{girl.age}</span>
                              </h3>
                              <p className="text-[11px] font-semibold text-zinc-300 truncate drop-shadow flex items-center gap-1">
                                <span>📍</span>
                                <span>{girl.location}</span>
                              </p>
                            </div>

                            {/* Action Chat Button */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-[#EC4899]/30 group-hover:scale-110 transition duration-300 border border-white/20">
                              <MessageCircle size={15} className="fill-current text-white" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom alert banner */}
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-400 text-xs font-semibold relative z-10 overflow-hidden">
                    <Sparkles size={14} className="text-[#EC4899]" />
                    <span>No active {isFemale ? 'boys' : 'girls'} are online right now. Check back later!</span>

                    {/* Floating hearts */}
                    <div className="absolute right-6 flex items-center gap-1.5 text-[#EC4899]/30">
                      <Heart size={10} className="fill-current" />
                      <Heart size={14} className="fill-current" />
                    </div>
                  </div>
                </>
              )}

            </Card>
          </div>

          {/* RIGHT COLUMN: Quick Actions & Verification */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Actions Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h3 className="font-bold text-white tracking-tight text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-[#EC4899]" />
                <span>Quick Navigation</span>
              </h3>

              <div className="space-y-3">
                {/* Buy Coins button - Hidden for girl/female role */}
                {!isFemale && (
                  <Button
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-2 border-0 shadow-md transition-transform hover:scale-[1.01]"
                    asChild
                  >
                    <Link href="/user/wallet/coins">
                      <Coins size={15} />
                      <span>Buy Coins</span>
                    </Link>
                  </Button>
                )}

                {/* Search Unique ID button */}
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01]"
                  asChild
                >
                  <Link href="/user/search">
                    <Search size={15} />
                    <span>Search Unique ID</span>
                  </Link>
                </Button>

                {/* Withdraw Earnings button - Hidden for boy/male role */}
                {isFemale && (
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-purple-500/30 hover:border-purple-500 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01]"
                    asChild
                  >
                    <Link href="/user/withdraw">
                      <BadgeIndianRupee size={15} />
                      <span>Withdraw Earnings</span>
                    </Link>
                  </Button>
                )}

                {/* Edit Profile button */}
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01]"
                  asChild
                >
                  <Link href="/user/profile">
                    <PenSquare size={15} />
                    <span>Edit Profile</span>
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Verification Status Card */}
            <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6.5 shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h3 className="font-bold text-white tracking-tight text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                <Shield size={14} className="text-[#EC4899]" />
                <span>Verification Status</span>
              </h3>

              <div className="space-y-4 text-xs font-semibold">

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Email</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <span>Added</span>
                    <CheckCircle2 size={14} className="text-[#10B981]" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Unique ID</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <span>{user?.unique_id || 'Assigned'}</span>
                    <CheckCircle2 size={14} className="text-[#10B981]" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">ID Verification</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="text-zinc-455 font-bold uppercase tracking-wider">Not_submitted</span>
                    <Clock size={14} className="text-[#F59E0B]" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Age Verification</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="text-zinc-455 font-bold">Pending</span>
                    <Clock size={14} className="text-[#7C3AED]" />
                  </div>
                </div>

              </div>
            </Card>

          </div>
        </div>

        {/* BOTTOM ROW: Get matches booster, profile views, activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Get More Matches (Booster) */}
          <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] overflow-hidden relative group min-h-[190px] flex items-center justify-between">
            <div className="space-y-4 max-w-[60%] z-10">
              <div>
                <h4 className="text-base font-black text-white leading-none tracking-tight">Get More Matches</h4>
                <p className="text-[11px] text-zinc-400 font-bold mt-1.5 leading-relaxed">
                  Increase your visibility and get more likes & matches.
                </p>
              </div>
              <Button
                size="sm"
                className="h-9 rounded-full bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-[10px] font-black text-white border-0 transition-all duration-300 hover:scale-[1.02] shadow-md px-5 uppercase tracking-wide"
                asChild
              >
                <Link href="/user/discover">Boost Profile</Link>
              </Button>
            </div>

            {/* Glowing Rocket Ship Graphic */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center pointer-events-none select-none animate-float-slow z-0">
              <div className="absolute w-16 h-16 bg-[#EC4899]/35 rounded-full blur-xl pointer-events-none" />
              <img
                src="/neon-rocket.jpg"
                alt="Rocket illustration"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] relative z-10 rounded-xl"
              />
            </div>
          </Card>

          {/* Card 2: Profile Views */}
          <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-[190px]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <Eye size={14} className="text-[#EC4899]" />
                <span>Profile Views</span>
              </div>
              <h3 className="text-4xl font-black text-white leading-none pt-2">0</h3>
              <p className="text-[11px] text-zinc-450 font-bold leading-normal">
                Who viewed your profile
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="text-[10px] font-bold text-[#10B981]">0% this week</p>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-[#10B981]" />
              </div>
            </div>
          </Card>

          {/* Card 3: Your Activity */}
          <Card className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-[190px] relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={14} className="text-[#7C3AED]" />
                <span>Your Activity</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-bold mt-2 leading-relaxed max-w-[80%]">
                Keep going! Your journey is just getting started.
              </p>
            </div>

            {/* Glowing Activity Wave Chart */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-35 pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,28 Q15,10 30,22 T60,5 T90,25 L100,30 L0,30 Z" fill="url(#pinkGrad)" />
                <path d="M0,28 Q15,10 30,22 T60,5 T90,25" fill="none" stroke="#EC4899" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Card>

        </div>

      </Container>
    </div>
  );
}
