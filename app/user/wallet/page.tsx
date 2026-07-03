'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, History, Plus } from 'lucide-react';
import { currentUser } from '@/lib/mockData';

export default function WalletPage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Wallet</h1>

        {/* Coins Balance */}
        <Card className="mb-6">
          <div className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">Available Balance</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                {currentUser.coins}
              </div>
              <span className="text-2xl">💎</span>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Ember Coins</p>
            <Button size="lg" asChild>
              <Link href="/user/wallet/coins">
                <Plus size={18} />
                Buy Coins
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Links */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/user/wallet/coins">
                    <Plus size={18} />
                    Purchase Coins
                  </Link>
                </Button>
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

          {/* Earnings Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Earnings</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total Earned</span>
                  <span className="font-semibold">₹{currentUser.earnings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">This Month</span>
                  <span className="font-semibold">₹1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Pending</span>
                  <span className="font-semibold">₹500</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
