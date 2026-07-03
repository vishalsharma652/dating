'use client';

import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { coinPackages } from '@/lib/mockData';

export default function CoinPurchasePage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Buy Coins</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Purchase coins to boost your profile and unlock premium features
        </p>

        {/* Coin Packages */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coinPackages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  Most Popular
                </Badge>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-pink-500">{pkg.coins}</p>
                  <p className="text-xs text-zinc-500">Coins</p>
                </div>

                {pkg.bonus > 0 && (
                  <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{pkg.bonus} Bonus
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-2xl font-bold">₹{pkg.price}</p>
                </div>

                <Button
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                      : ''
                  }`}
                >
                  Purchase
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <Card className="mt-12">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-6">What can you do with coins?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                'Boost your profile for better visibility',
                'Send super likes to stand out',
                'Get chat access with new matches',
                'Unlock special features and filters',
                'Access profile analytics',
                'Get priority support',
              ].map((benefit) => (
                <div key={benefit} className="flex gap-3">
                  <Check className="text-green-500 flex-shrink-0" size={24} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="mt-8">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Refund Policy</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
              All purchases are instant and non-refundable. Coins never expire and can be used anytime.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              For issues or questions about your purchase, contact our support team.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
