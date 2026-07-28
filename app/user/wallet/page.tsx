'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, History, Plus, Wallet, Copy, CheckCircle2,
  ArrowDownRight, ArrowUpRight, Coins, BadgeIndianRupee, ShieldCheck
} from 'lucide-react';
import { getStoredUser, userApi } from '@/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>({
    walletId: null,
    coins: 0,
    earnings: 0,
    totalPurchased: 0,
    totalSpent: 0,
    totalEarned: 0,
    withdrawalBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    userApi.wallet()
      .then((data) => setWallet((prev: any) => ({ ...prev, ...data })))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load wallet'))
      .finally(() => setLoading(false));
  }, []);

  const copyWalletId = () => {
    if (!wallet.walletId) return;
    navigator.clipboard.writeText(wallet.walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="space-y-3">
        <Wallet className="mx-auto text-pink-500 animate-pulse" size={40} />
        <p className="text-zinc-500">Loading wallet...</p>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const isBoy = String(getStoredUser()?.gender || '').toLowerCase() === 'male';

  return (
    <div className="p-4 md:p-8 bg-[#070B18] min-h-screen text-white">
      <Container>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
            <Wallet size={28} className="text-pink-500" /> My Wallet
          </h1>
          <p className="text-zinc-400 text-sm">Your coins, earnings & transactions — all in one place</p>
        </div>

        {/* Wallet ID Card — Premium Design */}
        {wallet.walletId && (
          <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1040] via-[#0f0a2a] to-[#0d1628] border border-purple-500/20 p-6 shadow-[0_0_40px_rgba(124,58,237,0.15)]">
            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-purple-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Verified Wallet ID</span>
                </div>
                <div className="font-black text-2xl sm:text-3xl tracking-[0.15em] text-white font-mono">
                  {wallet.walletId}
                </div>
                <p className="text-zinc-500 text-xs mt-1.5">Use this ID for transactions, support &amp; tracking</p>
              </div>
              <button
                type="button"
                onClick={copyWalletId}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border self-start sm:self-auto ${
                  copied
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25 hover:border-purple-500/50'
                }`}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
          </div>
        )}

        {/* Balance Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          {/* Coins Balance */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600/20 to-rose-900/20 border border-pink-500/20 p-5">
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Coins size={18} className="text-pink-400" />
            </div>
            <p className="text-xs font-bold text-pink-300/70 uppercase tracking-wider mb-2">Coin Balance</p>
            <p className="text-4xl font-black text-white mb-0.5">{wallet.coins ?? 0}</p>
            <p className="text-xs text-zinc-500">Saathika Coins</p>
            {isBoy && (
              <Link
                href="/user/wallet/coins"
                className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition"
              >
                <Plus size={12} /> Buy More Coins
              </Link>
            )}
          </div>

          {/* Earnings Balance */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-900/20 border border-emerald-500/20 p-5">
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <BadgeIndianRupee size={18} className="text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-emerald-300/70 uppercase tracking-wider mb-2">Earnings</p>
            <p className="text-4xl font-black text-white mb-0.5">₹{Number(wallet.earnings ?? 0).toFixed(0)}</p>
            <p className="text-xs text-zinc-500">Available to withdraw</p>
            <Link
              href="/user/withdraw"
              className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <ArrowUpRight size={12} /> Withdraw
            </Link>
          </div>

          {/* Total Stats */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-500/20 p-5 sm:col-span-2 lg:col-span-1">
            <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-400" />
            </div>
            <p className="text-xs font-bold text-blue-300/70 uppercase tracking-wider mb-3">Lifetime Stats</p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5"><ArrowDownRight size={12} className="text-pink-400" />Total Purchased</span>
                <span className="text-sm font-black text-white">{wallet.totalPurchased ?? 0} coins</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5"><ArrowUpRight size={12} className="text-emerald-400" />Total Earned</span>
                <span className="text-sm font-black text-white">{wallet.totalEarned ?? 0} coins</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Coins size={12} className="text-blue-400" />Total Spent</span>
                <span className="text-sm font-black text-white">{wallet.totalSpent ?? 0} coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-[#101827]/60 border border-white/5 rounded-2xl">
          <div className="p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {isBoy && (
                <Button
                  className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border-0 font-bold text-sm gap-2"
                  asChild
                >
                  <Link href="/user/wallet/coins">
                    <Plus size={16} />
                    Purchase Coins
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="rounded-xl font-bold text-sm gap-2 border-white/10 text-zinc-300 hover:bg-white/5" asChild>
                <Link href="/user/wallet/history">
                  <History size={16} />
                  Transaction History
                </Link>
              </Button>
              <Button variant="outline" className="rounded-xl font-bold text-sm gap-2 border-white/10 text-zinc-300 hover:bg-white/5" asChild>
                <Link href="/user/earnings">
                  <TrendingUp size={16} />
                  View Earnings
                </Link>
              </Button>
              <Button variant="outline" className="rounded-xl font-bold text-sm gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" asChild>
                <Link href="/user/withdraw">
                  <BadgeIndianRupee size={16} />
                  Withdraw
                </Link>
              </Button>
            </div>
          </div>
        </Card>

      </Container>
    </div>
  );
}
