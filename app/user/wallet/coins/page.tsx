'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Loader } from '@/components/ui/loader';
import {
  Check, Sparkles, Crown, Zap, Shield, Star, Flame,
  Heart, MessageCircle, Eye, ArrowRight, Gift
} from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

const PREMIUM_PLANS = [
  {
    id: 'premium1',
    tier: 1,
    label: 'Premium 1',
    subtitle: 'Silver',
    tagline: 'Perfect to get started',
    color: {
      bg: 'from-slate-700/40 via-zinc-800/30 to-slate-900/40',
      border: 'border-slate-400/30 hover:border-slate-400/60',
      badge: 'bg-slate-600/30 border-slate-400/30 text-slate-300',
      btn: 'from-slate-500 to-zinc-600 hover:from-slate-400 hover:to-zinc-500',
      glow: 'bg-slate-400/8',
      icon: 'text-slate-300',
      accent: 'text-slate-300',
      tag: 'bg-slate-500/20 text-slate-300 border-slate-400/20',
    },
    icon: <Star size={22} />,
    emoji: '🥈',
    popular: false,
    features: [
      { icon: <MessageCircle size={15} />, text: 'Unlimited Chat Messages' },
      { icon: <Heart size={15} />, text: '50 Super Likes / month' },
      { icon: <Eye size={15} />, text: 'See who liked you' },
      { icon: <Zap size={15} />, text: 'Profile Boost — 3× / week' },
      { icon: <Shield size={15} />, text: 'Hide Ads' },
      { icon: <Gift size={15} />, text: 'Send Virtual Gifts' },
    ],
    packages: [], // filled from API or static
  },
  {
    id: 'premium2',
    tier: 2,
    label: 'Premium 2',
    subtitle: 'Gold',
    tagline: 'Best for serious connections',
    color: {
      bg: 'from-amber-600/25 via-yellow-900/20 to-amber-950/30',
      border: 'border-amber-400/40 hover:border-amber-400/70',
      badge: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
      btn: 'from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500',
      glow: 'bg-amber-400/10',
      icon: 'text-amber-400',
      accent: 'text-amber-400',
      tag: 'bg-amber-500/15 text-amber-400 border-amber-400/25',
    },
    icon: <Crown size={22} />,
    emoji: '🥇',
    popular: true,
    features: [
      { icon: <MessageCircle size={15} />, text: 'Unlimited Chat — Priority Queue' },
      { icon: <Heart size={15} />, text: 'Unlimited Super Likes' },
      { icon: <Eye size={15} />, text: 'See who liked & visited you' },
      { icon: <Zap size={15} />, text: 'Profile Boost — Daily + Top Placement' },
      { icon: <Shield size={15} />, text: 'Hide Ads + Incognito Mode' },
      { icon: <Gift size={15} />, text: 'Premium Exclusive Gifts' },
      { icon: <Star size={15} />, text: 'Verified Gold Badge 🥇' },
      { icon: <Flame size={15} />, text: 'Trending / Hot Profile Tag' },
    ],
    packages: [],
  },
];

export default function CoinPurchasePage() {
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | string | null>(null);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkFemaleUser = (u: any) => {
      const userGender = String(u?.gender || u?.role || '').toLowerCase();
      return ['female', 'woman', 'girl', 'women'].includes(userGender);
    };

    const storedUser = getStoredUser();
    if (checkFemaleUser(storedUser)) {
      setIsRedirecting(true);
      router.replace('/user/wallet');
      return;
    }

    userApi.profile()
      .then((res) => {
        if (checkFemaleUser(res?.user)) {
          setIsRedirecting(true);
          router.replace('/user/wallet');
        }
      })
      .catch(() => undefined);

    userApi.coinPackages()
      .then((data) => setCoinPackages(data.packages || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load coin packages'))
      .finally(() => setLoading(false));
  }, [router]);

  const purchase = (packageId: number | string) => {
    setPurchasingId(packageId);
    router.push(`/user/wallet/coins/payment?packageId=${packageId}`);
  };

  if (isRedirecting) return <Loader text="Redirecting..." />;
  if (loading) return <Loader text="Loading premium plans..." />;

  // Split packages into two halves for plan 1 and plan 2
  const half = Math.ceil(coinPackages.length / 2);
  const plan1Packages = coinPackages.length > 0 ? coinPackages.slice(0, half) : [];
  const plan2Packages = coinPackages.length > 0 ? coinPackages.slice(half) : [];
  const splitPackages = [plan1Packages, plan2Packages];

  return (
    <div className="min-h-screen bg-[#070B18] text-white pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0530] via-[#0d1628] to-[#070B18] border-b border-white/5 px-4 py-14 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-700/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-full px-4 py-1.5 text-xs font-black text-amber-400 mb-4 uppercase tracking-wider">
            <Crown size={13} /> Premium Plans
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
            Upgrade Your Experience
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            Choose a premium plan and unlock exclusive features to connect with more people
          </p>
        </div>
      </div>

      <Container>
        <div className="py-10">
          {error && (
            <p className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</p>
          )}

          {/* Plan Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {PREMIUM_PLANS.map((plan, pi) => {
              const pkgs = splitPackages[pi] ?? [];

              return (
                <div
                  key={plan.id}
                  className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${plan.color.bg} ${plan.color.border} transition-all duration-300`}
                >
                  {/* Glow */}
                  <div className={`absolute inset-0 pointer-events-none ${plan.color.glow} rounded-3xl`} />

                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 bg-amber-500/90 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      <Sparkles size={10} /> Most Popular
                    </div>
                  )}

                  <div className="relative z-10 p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${plan.color.badge} border flex items-center justify-center flex-shrink-0 ${plan.color.icon}`}>
                        {plan.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xl">{plan.emoji}</span>
                          <h2 className="text-2xl font-black text-white">{plan.label}</h2>
                        </div>
                        <span className={`inline-block text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${plan.color.tag}`}>
                          {plan.subtitle}
                        </span>
                        <p className="text-xs text-zinc-400 mt-1.5">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-3 text-sm text-zinc-200">
                          <span className={`flex-shrink-0 ${plan.color.accent}`}>{f.icon}</span>
                          <span>{f.text}</span>
                          <Check size={13} className={`ml-auto flex-shrink-0 ${plan.color.accent}`} />
                        </li>
                      ))}
                    </ul>

                    {/* Divider */}
                    <div className="border-t border-white/6 mb-5" />

                    {/* Coin Packages */}
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3">Choose Coin Package</p>
                    {pkgs.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No packages available</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {pkgs.map((pkg: any) => (
                          <button
                            key={pkg.id}
                            onClick={() => purchase(pkg.id)}
                            disabled={purchasingId === pkg.id}
                            className={`group w-full rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 px-4 py-3 flex items-center justify-between transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{pkg.coins} Coins</span>
                                {Boolean(pkg.popular) && (
                                  <span className="text-[9px] bg-pink-500/20 border border-pink-500/30 text-pink-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">Best</span>
                                )}
                                {Number(pkg.bonus) > 0 && (
                                  <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded-full font-black">+{pkg.bonus} Bonus</span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500">{pkg.name}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-base font-black text-white">₹{pkg.price}</span>
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${plan.color.btn} flex items-center justify-center flex-shrink-0 transition group-hover:scale-110`}>
                                <ArrowRight size={14} className="text-white" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-white/6 bg-white/3">
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-300">Plan Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-5 py-3 text-zinc-400 font-bold">Feature</th>
                    <th className="text-center px-4 py-3 text-slate-300 font-black">🥈 Silver</th>
                    <th className="text-center px-4 py-3 text-amber-400 font-black">🥇 Gold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {[
                    ['Super Likes', '50/month', 'Unlimited'],
                    ['Profile Boost', '3× / week', 'Daily + Top'],
                    ['Incognito Mode', '—', '✓'],
                    ['Verified Badge', 'Silver', 'Gold 🥇'],
                    ['Hot/Trending Tag', '—', '✓'],
                    ['Exclusive Gifts', '—', '✓'],
                  ].map(([feat, s, g], i) => (
                    <tr key={i} className="hover:bg-white/2 transition">
                      <td className="px-5 py-3 text-zinc-300">{feat}</td>
                      <td className="px-4 py-3 text-center text-slate-300 font-semibold">{s}</td>
                      <td className="px-4 py-3 text-center text-amber-400 font-semibold">{g}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Note */}
          <div className="text-center text-xs text-zinc-500 space-y-1">
            <p>🔐 Secure payment · All purchases are non-refundable · Coins never expire</p>
            <p>Need help? Contact <span className="text-pink-400">support@saathika.com</span></p>
          </div>
        </div>
      </Container>
    </div>
  );
}
