'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.transactions()
      .then((data) => setTransactions(data.transactions || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading transactions...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header with Back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/user/wallet"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0"
            title="Back to Wallet"
          >
            <ArrowLeft size={18} className="text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">View all your wallet transactions</p>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 && <Card className="p-8 text-center text-zinc-500">No transactions found.</Card>}
          {transactions.map((txn) => {
            const coinsVal = Number(txn.coins || 0);
            const titleLower = String(txn.title || '').toLowerCase();
            const descLower = String(txn.description || '').toLowerCase();
            const typeLower = String(txn.type || '').toLowerCase();

            let displayTitle = txn.title;
            if (typeLower === 'withdrawal' || titleLower.includes('withdrawal') || descLower.includes('withdrawal')) {
              displayTitle = txn.title || 'Withdrawal Requested';
            } else if (typeLower === 'purchase' || titleLower.includes('purchase')) {
              displayTitle = txn.title || 'Coin Purchase';
            } else if (typeLower === 'welcome_bonus' || titleLower.includes('welcome')) {
              displayTitle = txn.title || 'Welcome Bonus';
            } else if (titleLower.includes('video') || descLower.includes('video')) {
              displayTitle = coinsVal < 0 ? 'Video Call (1 min) Charged' : 'Video Call (1 min) Earning';
            } else if (titleLower.includes('voice') || titleLower.includes('audio') || descLower.includes('voice') || descLower.includes('audio')) {
              displayTitle = coinsVal < 0 ? 'Voice Call (1 min) Charged' : 'Voice Call (1 min) Earning';
            } else if (!displayTitle) {
              displayTitle = 'Transaction';
            }

            return (
              <Card key={txn.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{displayTitle}</h3>
                    <p className="text-sm text-zinc-400">{txn.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">{txn.date}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-lg font-bold ${coinsVal >= 0 ? 'text-emerald-400' : 'text-pink-400'}`}>
                        {coinsVal > 0 ? '+' : ''}{coinsVal} coins
                      </p>
                      {Number(txn.amount) > 0 && <span className="text-zinc-500">₹{txn.amount}</span>}
                    </div>
                    <Badge variant={txn.status === 'completed' ? 'default' : 'pink'}>{txn.status}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
