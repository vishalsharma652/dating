'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Loader } from '@/components/ui/loader';
import {
  Zap, Shield, ArrowRight, Coins, CheckCircle2, Flame, HeartHandshake
} from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  if (loading) return <Loader text="Loading coin packages..." />;

  return (
    <div className="min-h-screen bg-[#070B18] text-white pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0530] via-[#0d1628] to-[#070B18] border-b border-white/5 px-4 py-12 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-full px-4 py-1.5 text-xs font-black text-amber-400 mb-4 uppercase tracking-wider">
            <Coins size={14} className="text-amber-400" />
            Coin Recharge
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
            Recharge Your Coins
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            Choose a coin package to chat, make calls, and send gifts to your matches.
          </p>
        </div>
      </div>

      <Container>
        <div className="py-10">
          {error && (
            <p className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20 text-center font-medium">
              {error}
            </p>
          )}

          {/* 4 Coin Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {coinPackages.map((pkg: any) => {
              const isPopular = Boolean(pkg.popular);
              const isSelecting = purchasingId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  onClick={() => purchase(pkg.id)}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer group select-none ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#2a1b4e] via-[#1a1133] to-[#100b24] border-2 border-amber-400/60 shadow-xl shadow-purple-900/30 hover:border-amber-300 hover:scale-[1.02]'
                      : 'bg-gradient-to-b from-[#13172e] via-[#0d1022] to-[#090b17] border border-white/10 hover:border-purple-500/40 hover:bg-[#161b36] hover:scale-[1.01]'
                  }`}
                >
                  {/* Glowing background on popular */}
                  {isPopular && (
                    <div className="absolute inset-0 bg-amber-400/5 rounded-3xl pointer-events-none" />
                  )}

                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      <Flame size={12} className="fill-black" /> Best Value
                    </div>
                  )}

                  <div>
                    {/* Top Package Name & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-inner">
                        🪙
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {pkg.name}
                      </span>
                    </div>

                    {/* Coins Amount */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          {Number(pkg.coins).toLocaleString('en-IN')}
                        </span>
                        <span className="text-amber-400 font-bold text-sm">Coins</span>
                      </div>
                      {Number(pkg.bonus) > 0 && (
                        <span className="inline-block text-[10px] text-emerald-400 font-black bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full mt-1.5">
                          +{pkg.bonus} Bonus Coins
                        </span>
                      )}
                    </div>

                    {/* Quick Features List */}
                    <ul className="space-y-2 text-xs text-zinc-300 mb-6 border-t border-white/5 pt-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Instant Wallet Credit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Chat &amp; Video Calling</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                        <span>Coins Never Expire</span>
                      </li>
                    </ul>
                  </div>

                  {/* Price & Buy Button */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs text-zinc-400 font-semibold">Total Price</span>
                      <span className="text-2xl font-black text-white tracking-tight">
                        ₹{Number(pkg.price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSelecting}
                      className={`w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-lg ${
                        isPopular
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black hover:opacity-95 shadow-amber-500/20'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
                      }`}
                    >
                      {isSelecting ? (
                        'Processing...'
                      ) : (
                        <>
                          Recharge Now <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Instant Credit</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Coins added to your wallet within minutes of payment</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Safe &amp; Secure</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Verified UPI QR payments with end-to-end encryption</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">24/7 Support</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Need help with payment? Contact our support team</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-zinc-500 space-y-1">
            <p>🔐 100% Secure Payment · Coins never expire in your wallet</p>
            <p>Need help? Contact <span className="text-pink-400 font-semibold">support@saathika.com</span></p>
          </div>
        </div>
      </Container>
    </div>
  );
}
