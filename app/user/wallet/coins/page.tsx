'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Check, Sparkles, Crown, Zap, ShieldCheck } from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

const DEFAULT_PREMIUM_1 = [
  { id: 1, name: 'Starter Pack', coins: 50, price: 250, bonus: 0, popular: false, planType: 'Premium 1' },
  { id: 2, name: 'Popular Pack', coins: 100, price: 550, bonus: 0, popular: true, planType: 'Premium 1' },
  { id: 3, name: 'Pro Pack', coins: 200, price: 1150, bonus: 0, popular: false, planType: 'Premium 1' },
];

const DEFAULT_PREMIUM_2 = [
  { id: 4, name: 'VIP Pack', coins: 400, price: 2350, bonus: 0, popular: true, planType: 'Premium 2' },
  { id: 5, name: 'Royal VIP Pack', coins: 1000, price: 6500, bonus: 0, popular: false, planType: 'Premium 2' },
];

export default function CoinPurchasePage() {
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'premium1' | 'premium2'>('premium1');
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
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
      .then((data) => {
        const pkgs = data.packages || [];
        setCoinPackages(pkgs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load coin packages'))
      .finally(() => setLoading(false));
  }, [router]);

  const purchase = (packageId: number | string) => {
    router.push(`/user/wallet/coins/payment?packageId=${packageId}`);
  };

  if (isRedirecting) return <Loader text="Redirecting..." />;
  if (loading) return <Loader text="Loading Premium packages..." />;

  // Filter packages for Premium 1 and Premium 2 based on coins
  const p1Packages = coinPackages.length > 0
    ? coinPackages.filter((p) => Number(p.coins) <= 200)
    : DEFAULT_PREMIUM_1;

  const p2Packages = coinPackages.length > 0
    ? coinPackages.filter((p) => Number(p.coins) > 200)
    : DEFAULT_PREMIUM_2;

  const currentDisplayPackages = activeTab === 'premium1'
    ? (p1Packages.length > 0 ? p1Packages : DEFAULT_PREMIUM_1)
    : (p2Packages.length > 0 ? p2Packages : DEFAULT_PREMIUM_2);

  return (
    <div className="p-4 md:p-8 bg-[#070B18] min-h-screen text-white">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="text-pink-500" size={32} /> Choose Your Premium Plan
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Select between <span className="text-pink-400 font-bold">Premium 1</span> and <span className="text-amber-400 font-bold">Premium 2</span> plans to unlock coins, priority chat, and VIP profile boost!
          </p>
        </div>

        {message && <p className="mb-6 rounded-2xl bg-green-500/10 border border-green-500/30 p-4 text-sm font-semibold text-green-400 text-center">{message}</p>}
        {error && <p className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-semibold text-red-400 text-center">{error}</p>}

        {/* Premium 1 & Premium 2 Tab Bar Switcher */}
        <div className="flex items-center justify-center max-w-md mx-auto mb-10 p-1.5 bg-white/[0.04] border border-white/10 rounded-full backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab('premium1')}
            className={`flex-1 py-3 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'premium1'
                ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-lg shadow-pink-500/25 scale-[1.02]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>Premium 1 Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('premium2')}
            className={`flex-1 py-3 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'premium2'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Crown size={16} />
            <span>Premium 2 VIP Plan</span>
          </button>
        </div>

        {/* Package Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {currentDisplayPackages.map((pkg) => {
            const isP2 = activeTab === 'premium2';
            return (
              <Card
                key={pkg.id}
                className={`relative bg-[#0D1424] border rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between shadow-xl ${
                  isP2
                    ? 'border-amber-500/30 hover:border-amber-400 shadow-amber-500/10'
                    : 'border-pink-500/30 hover:border-pink-400 shadow-pink-500/10'
                }`}
              >
                {/* Top Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 whitespace-nowrap">
                  <Badge className={`px-3 py-1 font-black text-[10px] uppercase tracking-wider rounded-full shadow-md ${
                    isP2
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0'
                      : 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white border-0'
                  }`}>
                    {isP2 ? <Crown size={11} className="inline mr-1" /> : <Sparkles size={11} className="inline mr-1" />}
                    {isP2 ? 'Premium 2 VIP' : 'Premium 1 Plan'}
                  </Badge>
                </div>

                <div className="pt-2">
                  <h3 className="text-xl font-black text-white text-center mb-3">{pkg.name}</h3>

                  <div className="text-center my-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className={`text-4xl font-black ${isP2 ? 'text-amber-400' : 'text-pink-400'}`}>
                      {pkg.coins}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mt-1">Total Coins</p>
                  </div>

                  {Number(pkg.bonus) > 0 && (
                    <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                      <p className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
                        <Zap size={14} /> +{pkg.bonus} Extra Bonus Coins
                      </p>
                    </div>
                  )}

                  <div className="text-center my-4">
                    <p className="text-3xl font-black text-white">₹{pkg.price}</p>
                  </div>
                </div>

                <Button
                  onClick={() => purchase(pkg.id)}
                  disabled={purchasingId === pkg.id}
                  className={`w-full h-12 rounded-2xl font-black text-sm uppercase tracking-wide border-0 shadow-lg cursor-pointer transition-all ${
                    isP2
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-amber-500/20'
                      : 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white shadow-pink-500/20'
                  }`}
                >
                  {purchasingId === pkg.id ? 'Processing...' : `Get ${isP2 ? 'Premium 2' : 'Premium 1'}`}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Benefits Card */}
        <Card className="max-w-5xl mx-auto bg-[#0D1424]/90 border border-white/10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="text-pink-500" size={24} />
            Why Choose {activeTab === 'premium1' ? 'Premium 1' : 'Premium 2 VIP'}?
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              activeTab === 'premium1' ? 'Standard profile boost for 24 hours' : '2x VIP profile boost for maximum visibility',
              activeTab === 'premium1' ? 'Direct chat access with matches' : 'Priority chat access & instant message delivery',
              activeTab === 'premium1' ? '10 Coins per standard message' : 'Special Say Hi icebreaker discounts (5 Coins)',
              '100% Secure Instant Payment via Stripe & Razorpay',
              'Coins added to wallet immediately after recharge',
              'Dedicated customer support (10 AM to 6 PM)',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <Check className={activeTab === 'premium2' ? 'text-amber-400 shrink-0 mt-0.5' : 'text-pink-400 shrink-0 mt-0.5'} size={18} />
                <span className="text-xs font-semibold text-zinc-300 leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </div>
  );
}
