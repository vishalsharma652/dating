'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Check, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';

export default function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkBoyUser = (u: any) => {
      const userGender = String(u?.gender || u?.role || '').toLowerCase();
      const isFemale = ['female', 'woman', 'girl', 'women'].includes(userGender);
      return !isFemale;
    };

    const storedUser = getStoredUser();
    if (storedUser && checkBoyUser(storedUser)) {
      setIsRedirecting(true);
      router.replace('/user/wallet');
      return;
    }

    userApi.profile()
      .then((res) => {
        if (checkBoyUser(res?.user)) {
          setIsRedirecting(true);
          router.replace('/user/wallet');
        }
      })
      .catch(() => undefined);

    userApi.withdrawals()
      .then((data) => setWithdrawals(data.withdrawals || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load withdrawals'))
      .finally(() => setLoading(false));
  }, [router]);

  if (isRedirecting) return <Loader text="Redirecting..." />;

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading withdrawals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header with Back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/user/withdraw"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0"
            title="Back to Withdrawal"
          >
            <ArrowLeft size={18} className="text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Withdrawal History</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Track all your withdrawal requests</p>
          </div>
        </div>

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
