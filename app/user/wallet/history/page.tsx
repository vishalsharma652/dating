'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">View all your wallet transactions</p>

        <div className="space-y-3">
          {transactions.length === 0 && <Card className="p-8 text-center text-zinc-500">No transactions found.</Card>}
          {transactions.map((txn) => {
            const coinsVal = Number(txn.coins || 0);
            const isVideo = Math.abs(coinsVal) >= 100 || String(txn.title || '').toLowerCase().includes('video') || String(txn.description || '').toLowerCase().includes('video');
            const isVoice = String(txn.title || '').toLowerCase().includes('voice') || String(txn.title || '').toLowerCase().includes('audio');

            let displayTitle = txn.title;
            if (isVideo) {
              displayTitle = coinsVal < 0 ? 'Video Call (1 min) Charged' : 'Video Call (1 min) Earning';
            } else if (isVoice) {
              displayTitle = coinsVal < 0 ? 'Voice Call (1 min) Charged' : 'Voice Call (1 min) Earning';
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
