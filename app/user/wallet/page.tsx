'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, History, Plus } from 'lucide-react';
import { getStoredUser, userApi } from '@/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState({ coins: 0, earnings: 0, totalPurchased: 0, totalSpent: 0, totalEarned: 0, withdrawalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.wallet()
      .then((data) => setWallet((prev) => ({ ...prev, ...data })))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load wallet'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading wallet...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  const isBoy = String(getStoredUser()?.gender || '').toLowerCase() === 'male';
  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Wallet</h1>

        <Card className="mb-6">
          <div className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">Available Balance</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                {wallet.coins}
              </div>
              <span className="text-2xl">Coins</span>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Saathika Coins</p>
            {isBoy && <Button size="lg" asChild><Link href="/user/wallet/coins"><Plus size={18} />Buy Coins</Link></Button>}
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {isBoy && <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/user/wallet/coins">
                    <Plus size={18} />
                    Purchase Coins
                  </Link>
                </Button>}
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/user/wallet/history">
                    <History size={18} />
                    Transaction History
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/user/earnings">
                    <TrendingUp size={18} />
                    View Earnings
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Earnings</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total Earned</span>
                  <span className="font-semibold">{wallet.totalEarned} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Available</span>
                  <span className="font-semibold">{wallet.withdrawalBalance} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Pending</span>
                  <span className="font-semibold">{wallet.totalSpent} coins spent</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
