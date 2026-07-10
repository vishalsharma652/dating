'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { userApi } from '@/lib/api';
import { DollarSign, ArrowUpRight } from 'lucide-react';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const earningsData = [
    { month: 'Current', amount: earnings },
  ];

  useEffect(() => {
    userApi.wallet()
      .then((data) => setEarnings(Number(data.earnings) || 0))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading earnings...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Your Earnings</h1>

        <Card className="mb-6">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 mb-2">Total Earnings</p>
                <p className="text-5xl font-bold">Rs {earnings}</p>
              </div>
              <div className="w-16 h-16 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="text-green-500" size={32} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Available</p><p className="text-2xl font-semibold">Rs {earnings}</p></div>
              <div><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Pending</p><p className="text-2xl font-semibold">Rs 0</p></div>
              <div><p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Withdrawn</p><p className="text-2xl font-semibold">Rs 0</p></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-zinc-200/80 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Earnings Summary</h2>
          </div>
          <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {earningsData.map((data) => (
              <div key={data.month} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                <span className="font-medium">{data.month}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Rs {data.amount}</span>
                  <ArrowUpRight className="text-green-500" size={20} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </div>
  );
}
