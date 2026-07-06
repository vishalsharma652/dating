'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function WithdrawPage() {
  const [formData, setFormData] = useState({ amount: '', method: 'upi', bankName: '', accountNumber: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await userApi.createWithdrawal({
        amount: Number(formData.amount),
        method: formData.method,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
      });
      setMessage('Withdrawal request submitted.');
      setFormData({ amount: '', method: 'upi', bankName: '', accountNumber: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Withdrawal</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">Withdraw your earnings to your bank account</p>

        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Request Withdrawal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (Rs)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20"
                />
                <p className="text-xs text-zinc-500 mt-1">Minimum: Rs 500</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={formData.method}
                  onChange={(event) => setFormData({ ...formData, method: event.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20"
                >
                  <option value="upi">UPI (Instant)</option>
                  <option value="bank_transfer">Bank Transfer (1-2 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bank / UPI Name</label>
                <input
                  value={formData.bankName}
                  onChange={(event) => setFormData({ ...formData, bankName: event.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Account / UPI ID</label>
                <input
                  value={formData.accountNumber}
                  onChange={(event) => setFormData({ ...formData, accountNumber: event.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20"
                />
              </div>

              {message && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">{message}</p>}
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

              <Button className="w-full mt-6" onClick={submit} disabled={loading}>
                <DollarSign size={18} />
                {loading ? 'Submitting...' : 'Request Withdrawal'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/user/withdraw/history">
                <Wallet size={18} />
                View Withdrawal History
              </Link>
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  );
}
