'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Check } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CoinPurchasePage() {
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    userApi.coinPackages()
      .then((data) => setCoinPackages(data.packages || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load coin packages'))
      .finally(() => setLoading(false));
  }, []);

  const purchase = (packageId: number | string) => {
    router.push(`/user/wallet/coins/payment?packageId=${packageId}`);
  };

  if (loading) return <Loader text="Loading coin packages..." />;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Buy Coins</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Purchase coins to boost your profile and unlock premium features
        </p>
        {message && <p className="mb-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600">{message}</p>}
        {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coinPackages.length === 0 && <Card className="p-8 text-center text-zinc-500">No coin packages found.</Card>}
          {coinPackages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              {Boolean(pkg.popular) && (
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
                {Number(pkg.bonus) > 0 && (
                  <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{pkg.bonus} Bonus
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-2xl font-bold">Rs {pkg.price}</p>
                </div>
                <Button
                  className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}`}
                  disabled={purchasingId === pkg.id}
                  onClick={() => purchase(pkg.id)}
                >
                  {purchasingId === pkg.id ? 'Purchasing...' : 'Purchase'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

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
      </Container>
    </div>
  );
}
