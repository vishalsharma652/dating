'use client';

import { useEffect, useState } from 'react';
import { X, Users, Search, MessageCircle, Check, Clock, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { userApi, authApi, apiAssetUrl } from '@/lib/api';
import Link from 'next/link';
import { UserProfileModal } from '@/components/user/user-profile-modal';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'following' | 'followers' | 'friends';
  userId?: string | number;
}

export function FollowersModal({
  isOpen,
  onClose,
  initialTab = 'following',
  userId,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'friends'>(initialTab);
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    authApi.me().then((res: any) => setCurrentUser(res?.user)).catch(() => null);
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      userApi.getFollowing(userId).catch(() => ({ users: [] })),
      userApi.getFollowers(userId).catch(() => ({ users: [] })),
      userApi.getFriends(userId).catch(() => ({ users: [] }))
    ])
      .then(([gRes, fRes, frRes]) => {
        setFollowing(gRes.users || []);
        setFollowers(fRes.users || []);
        setFriends(frRes.users || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, initialTab, userId]);

  const handleToggleFollowUser = async (targetUserId: number | string) => {
    if (currentUser && (Number(targetUserId) === Number(currentUser.id) || String(targetUserId) === String(currentUser.unique_id))) {
      return;
    }
    try {
      const res = await userApi.toggleFollow(targetUserId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('follow:updated', { detail: { targetUserId, status: res.status } }));
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondFollowReq = async (requestId: number, action: 'accept' | 'decline', followerId: number) => {
    try {
      await userApi.respondFollowRequest(requestId, action);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('follow:updated', { detail: { targetUserId: followerId, status: action === 'accept' ? 'accepted' : 'none' } }));
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'following' ? following : activeTab === 'followers' ? followers : friends;
  const filteredList = currentList.filter((u) =>
    String(u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(u.uniqueId || u.unique_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 text-white overflow-hidden">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header & Tabs */}
          <div className="space-y-3 pr-8">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users size={20} className="text-[#EC4899]" />
              <span>Social Network</span>
            </h2>

            {/* 3 Tab buttons: Following, Followers, Friends */}
            <div className="grid grid-cols-3 p-1 bg-white/5 border border-white/5 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'following'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Following ({following.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'followers'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Followers ({followers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('friends')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'friends'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Friends ({friends.length}) 🤝
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#EC4899]/50 transition"
            />
          </div>

          {/* List items */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading social network data...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No {activeTab} found.
              </div>
            ) : (
              filteredList.map((u) => {
                const uniqueId = String(u.uniqueId || u.unique_id || u.id).replace(/^STK-/i, '').padStart(6, '0');
                const photoVal = u.photo && String(u.photo).trim()
                  ? (apiAssetUrl(u.photo) || u.photo)
                  : '/avatar-priya.jpg';

                return (
                  <div
                    key={u.id}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl flex items-center justify-between gap-3 transition"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedUserForProfile(u)}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={photoVal} alt={u.name} fallback={u.name?.[0] || 'U'} />
                        {Boolean(u.online) && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0D1424]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-white truncate hover:text-[#EC4899] transition">{u.name}</h4>
                          {(u.isFriend || activeTab === 'friends') && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              🤝 Friends (Free Chat)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-zinc-400 truncate">ID: {uniqueId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {currentUser && (Number(u.id) === Number(currentUser.id) || String(u.uniqueId || u.unique_id || '') === String(currentUser.unique_id || '')) ? (
                        <span className="px-3 py-1 rounded-xl bg-white/10 text-zinc-400 font-extrabold text-[10px] border border-white/10">
                          You
                        </span>
                      ) : activeTab === 'followers' && u.status === 'pending' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleRespondFollowReq(u.requestId, 'accept', u.id)}
                            className="h-7 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-[10px] border-0 cursor-pointer flex items-center gap-1"
                          >
                            <Check size={12} /> Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleRespondFollowReq(u.requestId, 'decline', u.id)}
                            className="h-7 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-[10px] border border-white/10 cursor-pointer flex items-center gap-1"
                          >
                            <X size={12} /> Decline
                          </Button>
                        </>
                      ) : (() => {
                        const isFollowing = activeTab === 'following' || activeTab === 'friends' || Boolean(u.isFriend) || u.myFollowStatus === 'accepted';
                        const isPending = !isFollowing && (u.myFollowStatus === 'pending' || (activeTab === 'followers' && u.status === 'pending'));
                        if (isPending) {
                          return (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleToggleFollowUser(u.id)}
                              className="h-7 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <Clock size={12} /> Requested
                            </Button>
                          );
                        }
                        return (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleToggleFollowUser(u.id)}
                            className={`h-7 px-2.5 rounded-xl font-bold text-[10px] border-0 cursor-pointer flex items-center gap-1 ${
                              isFollowing
                                ? 'bg-white/10 hover:bg-white/20 text-pink-300 border border-pink-500/30'
                                : 'bg-[#0095F6] hover:bg-[#1877F2] text-white'
                            }`}
                          >
                            {isFollowing ? (
                              <>
                                <UserCheck size={12} /> Following
                              </>
                            ) : (
                              <>
                                <UserPlus size={12} /> Follow
                              </>
                            )}
                          </Button>
                        );
                      })()}

                      <Link href={`/user/chat/${u.id}`} onClick={onClose}>
                        <Button
                          size="icon"
                          className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10"
                          title="Chat with user"
                        >
                          <MessageCircle size={13} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal when clicking a user */}
      {selectedUserForProfile && (
        <UserProfileModal
          isOpen={Boolean(selectedUserForProfile)}
          onClose={() => setSelectedUserForProfile(null)}
          userId={selectedUserForProfile.id}
          initialUser={selectedUserForProfile}
        />
      )}
    </>
  );
}
