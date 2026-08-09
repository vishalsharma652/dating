'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, Gift, UserPlus, Check, X, UserCheck } from 'lucide-react';
import { userApi } from '@/lib/api';
import Loading from '@/app/loading';
import { Avatar } from '@/components/ui/avatar';


export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadNotifications = () => {
      Promise.all([
        userApi.notifications(),
        userApi.getFollowRequests().catch(() => ({ requests: [] }))
      ])
        .then(([notifData, reqData]) => {
          if (!active) return;
          setNotifications(notifData.notifications || []);
          setUnread(Number(notifData.unread) || 0);
          setFollowRequests(reqData.requests || []);
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

  const handleRespondFollowRequest = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await userApi.respondFollowRequest(requestId, action);
      setFollowRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err: any) {
      console.error(err);
    }
  };

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

  if (loading) return (
    <div className="p-8 text-center min-h-screen flex items-center justify-center">
      <div className="space-y-3">
        <Loading />
      </div>
    </div>
  );

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

        {/* Pending Follow Requests Section */}
        {followRequests.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <UserPlus size={16} /> Follow Requests ({followRequests.length})
            </h2>
            <div className="space-y-3">
              {followRequests.map((req) => (
                <Card key={req.requestId} className="p-4 bg-[#0D1424] border border-pink-500/20 shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={req.photo || '/avatar-boy1.jpg'} alt={req.name} fallback={req.name?.[0] || 'U'} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-white truncate">{req.name}</h3>
                        <p className="text-xs text-zinc-400 truncate">requested to follow you.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        onClick={() => handleRespondFollowRequest(req.requestId, 'accept')}
                        className="h-8 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md border-0 cursor-pointer flex items-center gap-1"
                      >
                        <Check size={14} /> Accept
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRespondFollowRequest(req.requestId, 'decline')}
                        className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-bold text-xs border border-white/10 cursor-pointer flex items-center gap-1"
                      >
                        <X size={14} /> Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

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
