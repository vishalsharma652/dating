'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet } from 'lucide-react';
import { withdrawals } from '@/lib/mockData';

export default function WithdrawPage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Withdrawal</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Withdraw your earnings to your bank account
        </p>

        {/* Withdrawal Form */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Request Withdrawal</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20"
                />
                <p className="text-xs text-zinc-500 mt-1">Minimum: ₹500</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20">
                  <option>UPI (Instant)</option>
                  <option>Bank Transfer (1-2 Days)</option>
                </select>
              </div>

              <Button className="w-full mt-6">
                <DollarSign size={18} />
                Request Withdrawal
              </Button>
            </div>
          </div>
        </Card>

        {/* Links */}
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

        {/* Info */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="font-semibold mb-3">Withdrawal Details</h3>
            <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>• Minimum withdrawal amount: ₹500</li>
              <li>• UPI withdrawals are processed instantly</li>
              <li>• Bank transfers take 1-2 business days</li>
              <li>• Withdrawals are processed Monday to Friday, 10 AM - 6 PM</li>
              <li>• No withdrawal fees</li>
            </ul>
          </div>
        </Card>
      </Container>
    </div>
  );
}
