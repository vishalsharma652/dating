'use client';

import { useEffect, useState } from 'react';
import { X, Users, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { userApi, apiAssetUrl } from '@/lib/api';
import Link from 'next/link';
import { UserProfileModal } from '@/components/user/user-profile-modal';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  userId?: string | number;
}

export function FollowersModal({
  isOpen,
  onClose,
  initialTab = 'followers',
  userId,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLoading(true);
      Promise.all([
        userApi.getFollowers(userId).catch(() => ({ users: [] })),
        userApi.getFollowing(userId).catch(() => ({ users: [] }))
      ])
        .then(([fRes, gRes]) => {
          setFollowers(fRes.users || []);
          setFollowing(gRes.users || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialTab, userId]);

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
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

            {/* Tab buttons */}
            <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className={`py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'followers'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Followers ({followers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className={`py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === 'following'
                    ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Following ({following.length})
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
                        <h4 className="font-bold text-xs text-white truncate hover:text-[#EC4899] transition">{u.name}</h4>
                        <p className="text-[10px] font-semibold text-zinc-400 truncate">ID: {uniqueId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/user/chat/${u.id}`} onClick={onClose}>
                        <Button
                          size="icon"
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10"
                          title="Chat with user"
                        >
                          <MessageCircle size={14} />
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
