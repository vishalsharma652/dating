'use client';

import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { currentUser } from '@/lib/mockData';
import { TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

export default function EarningsPage() {
  const earningsData = [
    { month: 'June', amount: 1250 },
    { month: 'May', amount: 950 },
    { month: 'April', amount: 1100 },
  ];

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-8">Your Earnings</h1>

        {/* Total Earnings */}
        <Card className="mb-6">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-zinc-600 dark:text-zinc-400 mb-2">Total Earnings</p>
                <p className="text-5xl font-bold">₹{currentUser.earnings}</p>
              </div>
              <div className="w-16 h-16 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="text-green-500" size={32} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">This Month</p>
                <p className="text-2xl font-semibold">₹1,250</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Last Month</p>
                <p className="text-2xl font-semibold">₹950</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Pending</p>
                <p className="text-2xl font-semibold">₹500</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <div className="p-6 border-b border-zinc-200/80 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Earnings by Month</h2>
          </div>
          <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {earningsData.map((data) => (
              <div
                key={data.month}
                className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
              >
                <span className="font-medium">{data.month}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">₹{data.amount}</span>
                  <ArrowUpRight className="text-green-500" size={20} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* How to Earn */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">How to Earn</h2>
            <ul className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">•</span>
                <span>Earn ₹20 for every verified profile boost purchased by others who like you</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">•</span>
                <span>Get rewards for maintaining high profile ratings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">•</span>
                <span>Earn bonuses during special promotional periods</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-500 font-bold">•</span>
                <span>Refer friends and earn ₹100 for each successful referral</span>
              </li>
            </ul>
          </div>
        </Card>
      </Container>
    </div>
  );
}
