'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { Users, Heart, MessageCircle, TrendingUp, Circle } from 'lucide-react';
import { StatCard } from '@/components/user/stat-card';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { userApi } from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<{ user: any; profile: any; matches: any[]; activeGirls: any[]; assignedGirl: any | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const user = data?.user || {};
  const matches = data?.matches || [];
  const activeGirls = data?.activeGirls || [];
  const assignedGirl = data?.assignedGirl;
  const stats = [
    { label: 'Total Matches', value: matches.length, icon: Heart, change: `${matches.slice(0, 3).length} recent` },
    { label: 'New Messages', value: 0, icon: MessageCircle, change: 'Synced from chats' },
    { label: 'Active Girls', value: activeGirls.length, icon: Users, change: assignedGirl ? 'One assigned now' : 'Waiting for online users' },
    { label: 'Coins Balance', value: user.coins || 0, icon: TrendingUp },
  ];

  return (
    <div className="p-4 md:p-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name || 'User'}!</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Here&apos;s what&apos;s happening with your dating journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              trend="up"
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="p-6 border-b border-zinc-200/80 dark:border-zinc-800">
                <h2 className="text-xl font-semibold">Active Girls</h2>
              </div>
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {!assignedGirl && (
                  <div className="p-6 text-center text-zinc-500">No girls are online right now.</div>
                )}
                {assignedGirl && (
                  <div className="p-4 bg-green-50/80 dark:bg-green-950/20">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={assignedGirl.photo || '/placeholder.svg'}
                            alt={assignedGirl.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          <Circle className="absolute -right-1 bottom-0 fill-green-500 text-green-500" size={14} />
                        </div>
                        <div>
                          <p className="font-semibold">{assignedGirl.name}</p>
                          <p className="text-sm text-zinc-500">Assigned active girl</p>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/user/chat/${assignedGirl.id}`}>Start Chat</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {activeGirls.filter((girl) => girl.id !== assignedGirl?.id).slice(0, 4).map((girl) => (
                  <div key={girl.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={girl.photo || '/placeholder.svg'}
                            alt={girl.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <Circle className="absolute -right-1 bottom-0 fill-green-500 text-green-500" size={12} />
                        </div>
                        <div>
                          <p className="font-semibold">{girl.name}</p>
                          <p className="text-sm text-zinc-500">Online now</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/user/chat/${girl.id}`}>Chat</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b border-zinc-200/80 dark:border-zinc-800">
                <h2 className="text-xl font-semibold">Recent Matches</h2>
              </div>
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {matches.length === 0 && (
                  <div className="p-6 text-center text-zinc-500">No matches found yet.</div>
                )}
                {matches.slice(0, 3).map((match) => (
                  <div key={match.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={match.photo || '/placeholder.svg'}
                          alt={match.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{match.name}</p>
                          <p className="text-sm text-zinc-500">
                            Matched {match.matchedDate || 'recently'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/user/chat/${match.profileId || match.userId}`}>Message</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href="/user/discover">Start Discovering</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/user/wallet/coins">Buy Coins</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/user/profile/edit">Edit Profile</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Verification Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email</span>
                    <span className="font-semibold">{user.email ? 'Added' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone</span>
                    <span className="font-semibold">{user.phone ? 'Added' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ID Verification</span>
                    <span className="font-semibold capitalize">{user.kyc_status || 'pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Age Verification</span>
                    <span className="font-semibold">{user.age_verified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
