'use client';

import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { transactions } from '@/lib/mockData';

export default function TransactionHistoryPage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          View all your wallet transactions
        </p>

        {/* Transactions */}
        <div className="space-y-3">
          {transactions.map((txn) => (
            <Card key={txn.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{txn.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {txn.description}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{txn.date}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-lg font-semibold ${
                      txn.type === 'earning' ? 'text-green-500' : 'text-zinc-900 dark:text-white'
                    }`}>
                      {txn.type === 'earning' ? '+' : '-'}₹{txn.amount}
                    </p>
                    {txn.coins > 0 && (
                      <span className="text-pink-500">+{txn.coins} 💎</span>
                    )}
                  </div>
                  <Badge
                    variant={
                      txn.status === 'completed'
                        ? 'default'
                        : 'pink'
                    }
                  >
                    {txn.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
