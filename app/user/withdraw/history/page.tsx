'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.withdrawals()
      .then((data) => setWithdrawals(data.withdrawals || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load withdrawals'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading withdrawals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Withdrawal History</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Track all your withdrawal requests</p>

        <div className="space-y-3">
          {withdrawals.length === 0 && <Card className="p-8 text-center text-zinc-500">No withdrawals found.</Card>}
          {withdrawals.map((withdrawal) => {
            const StatusIcon = withdrawal.status === 'completed' ? Check : withdrawal.status === 'pending' ? Clock : AlertCircle;
            return (
              <Card key={withdrawal.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${withdrawal.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                      <StatusIcon className={withdrawal.status === 'completed' ? 'text-green-500' : 'text-yellow-500'} size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold">Rs {withdrawal.amount}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {withdrawal.method === 'upi' ? 'UPI' : 'Bank Transfer'} - {withdrawal.bankName || 'N/A'} - {withdrawal.accountNumber || 'N/A'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested on {withdrawal.requestDate}
                        {withdrawal.completedDate && ` - Completed on ${withdrawal.completedDate}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={withdrawal.status === 'completed' ? 'default' : 'pink'}>{withdrawal.status}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
