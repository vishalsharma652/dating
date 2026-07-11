'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Gift } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadNotifications = () => {
      userApi.notifications()
        .then((data) => {
          if (!active) return;
          setNotifications(data.notifications || []);
          setUnread(Number(data.unread) || 0);
          setError('');
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Unable to load notifications');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const getIcon = (type: string) => {
    const icons: Record<string, any> = { like: Heart, message: MessageCircle, match: Heart, promotion: Gift };
    return icons[type] || Bell;
  };

  const markAllAsRead = async () => {
    try {
      await userApi.markNotificationsRead();
      setNotifications([]);
      setUnread(0);
      window.dispatchEvent(new CustomEvent('notifications:unread', { detail: { unread: 0 } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update notifications');
    }
  };

  const openNotification = async (notification: any) => {
    try {
      if (!notification.read) {
        const data = await userApi.markNotificationRead(notification.id);
        const nextUnread = Number(data.unread) || 0;
        setUnread(nextUnread);
        setNotifications((current) => current.filter((item) => item.id !== notification.id));
        window.dispatchEvent(new CustomEvent('notifications:unread', { detail: { unread: nextUnread } }));
      }
    } catch {
      // Opening the related conversation is still useful if marking read fails.
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading notifications...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {unread} unread update{unread !== 1 ? 's' : ''}
        </p>

        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unread === 0}>
            Mark all as read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 && <Card className="p-8 text-center text-zinc-500">No notifications found.</Card>}
          {notifications.map((notif) => {
            const Icon = getIcon(notif.type);
            return (
              <Card
                key={notif.id}
                role="button"
                tabIndex={0}
                onClick={() => openNotification(notif)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') openNotification(notif);
                }}
                className={`p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition ${!notif.read ? 'border-l-4 border-l-pink-500' : ''}`}
              >
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
                    <p className="text-xs text-zinc-500">
                      {notif.timestamp}
                      {notif.senderName ? ` from ${notif.senderName}` : ''}
                    </p>
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
