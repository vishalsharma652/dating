'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Gift } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.notifications()
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    const icons: Record<string, any> = { like: Heart, message: MessageCircle, match: Heart, promotion: Gift };
    return icons[type] || Bell;
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading notifications...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Stay updated with all your activities</p>

        <div className="mb-6">
          <Button variant="outline" size="sm">Mark all as read</Button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 && <Card className="p-8 text-center text-zinc-500">No notifications found.</Card>}
          {notifications.map((notif) => {
            const Icon = getIcon(notif.type);
            return (
              <Card key={notif.id} className={`p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition ${!notif.read ? 'border-l-4 border-l-pink-500' : ''}`}>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-pink-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-semibold ${!notif.read ? 'text-pink-500' : ''}`}>{notif.title}</h3>
                      {!notif.read && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{notif.message}</p>
                    <p className="text-xs text-zinc-500">{notif.timestamp}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
