'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  ArrowLeft,
  Pin,
  PinOff,
  MessageCircle,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  Copy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { userApi, authApi, getStoredUser, apiAssetUrl } from '@/lib/api';
import Loading from '@/app/loading';
import { UserProfileModal } from '@/components/user/user-profile-modal';

function ChatListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTabParam = searchParams.get('tab');
  const initialSubtabParam = searchParams.get('subtab');

  const [mainTab, setMainTab] = useState<'chats' | 'friends'>(
    initialTabParam === 'friends' ? 'friends' : 'chats'
  );
  const [friendsSubTab, setFriendsSubTab] = useState<'following' | 'followers' | 'friends'>(
    initialSubtabParam === 'followers'
      ? 'followers'
      : initialSubtabParam === 'friends'
      ? 'friends'
      : 'following'
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [searchChats, setSearchChats] = useState('');
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState('');

  // Friends & Social Data
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [searchFriends, setSearchFriends] = useState('');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const isBoy = String(currentUser?.gender || '').toLowerCase() === 'male';

  useEffect(() => {
    setCurrentUser(getStoredUser());
    authApi.me().then((res: any) => {
      if (res?.user) setCurrentUser(res.user);
    }).catch(() => null);
  }, []);

  // Update tabs if URL params change
  useEffect(() => {
    if (initialTabParam === 'friends') {
      setMainTab('friends');
    } else if (initialTabParam === 'chats') {
      setMainTab('chats');
    }
    if (initialSubtabParam === 'followers' || initialSubtabParam === 'following' || initialSubtabParam === 'friends') {
      setFriendsSubTab(initialSubtabParam);
    }
  }, [initialTabParam, initialSubtabParam]);

  // Load Chats
  useEffect(() => {
    let active = true;

    const loadChats = () => {
      userApi.chats()
        .then((data) => {
          if (!active) return;
          const loadedChats = data.chats || [];
          setChats(loadedChats.sort((a: any, b: any) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))));
          setChatsError('');
        })
        .catch((err) => {
          if (active) setChatsError(err instanceof Error ? err.message : 'Unable to load conversations');
        })
        .finally(() => {
          if (active) setChatsLoading(false);
        });
    };

    loadChats();
    const interval = window.setInterval(loadChats, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Load Social / Friends Data
  const loadSocialData = () => {
    setSocialLoading(true);
    Promise.all([
      userApi.getFollowing().catch(() => ({ users: [] })),
      userApi.getFollowers().catch(() => ({ users: [] })),
      userApi.getFriends().catch(() => ({ users: [] }))
    ])
      .then(([gRes, fRes, frRes]) => {
        setFollowing(gRes.users || []);
        setFollowers(fRes.users || []);
        setFriends(frRes.users || []);
      })
      .finally(() => setSocialLoading(false));
  };

  useEffect(() => {
    loadSocialData();

    const handleFollowUpdated = () => {
      loadSocialData();
    };

    window.addEventListener('follow:updated', handleFollowUpdated);
    return () => {
      window.removeEventListener('follow:updated', handleFollowUpdated);
    };
  }, []);

  const handlePinToggle = async (e: React.MouseEvent, chatId: number | string) => {
    e.preventDefault();
    e.stopPropagation();

    // Immediate Optimistic Update
    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === chatId ? { ...c, isPinned: !c.isPinned } : c
      );
      return updated.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
    });

    try {
      const res = await userApi.togglePinChat(chatId);
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, isPinned: res.pinned } : c
        );
        return updated.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
      });
    } catch (err: any) {
      console.error('Pin error:', err);
    }
  };

  const handleToggleFollowUser = async (targetUserId: number | string) => {
    if (currentUser && (Number(targetUserId) === Number(currentUser.id) || String(targetUserId) === String(currentUser.unique_id))) {
      return;
    }
    try {
      const res = await userApi.toggleFollow(targetUserId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('follow:updated', { detail: { targetUserId, status: res.status } }));
      }
      loadSocialData();
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
      loadSocialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyId = () => {
    const uniqueId = String(currentUser?.unique_id || currentUser?.id || '').replace(/^STK-/i, '').padStart(6, '0');
    if (uniqueId) {
      navigator.clipboard.writeText(uniqueId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const filteredChats = useMemo(
    () => chats.filter((chat) => String(chat.name || '').toLowerCase().includes(searchChats.toLowerCase())),
    [chats, searchChats]
  );

  const currentFriendsList = friendsSubTab === 'following'
    ? following
    : friendsSubTab === 'followers'
    ? followers
    : friends;

  const filteredFriendsList = useMemo(() => {
    return currentFriendsList.filter((u) =>
      String(u.name || '').toLowerCase().includes(searchFriends.toLowerCase()) ||
      String(u.uniqueId || u.unique_id || '').toLowerCase().includes(searchFriends.toLowerCase())
    );
  }, [currentFriendsList, searchFriends]);

  const userUniqueIdDisplay = currentUser?.unique_id || currentUser?.id
    ? String(currentUser.unique_id || currentUser.id).replace(/^STK-/i, '').padStart(6, '0')
    : '000000';

  if (chatsLoading && socialLoading) {
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#070B18] text-white">
      <Container className="max-w-4xl space-y-6">

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/user/dashboard"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Messages & Friends
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Chat with your connections and manage your social network
              </p>
            </div>
          </div>
        </div>

        {/* MAIN 2 OPTIONS TABS: 1. Chat | 2. Friends (Frnds) */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0D1424] border border-white/10 rounded-2xl gap-2 shadow-lg">
          <button
            type="button"
            onClick={() => setMainTab('chats')}
            className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mainTab === 'chats'
                ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle size={18} className={mainTab === 'chats' ? 'text-white' : 'text-zinc-400'} />
            <span>Chat ({chats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('friends')}
            className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mainTab === 'friends'
                ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={18} className={mainTab === 'friends' ? 'text-white' : 'text-zinc-400'} />
            <span>Friends ({following.length + followers.length})</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* OPTION 1: CHAT TAB CONTENT */}
        {/* ───────────────────────────────────────────────────────────── */}
        {mainTab === 'chats' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Input for Chats */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
              <Input
                placeholder="Search conversations..."
                className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder-zinc-500 rounded-2xl focus:border-[#EC4899]/50"
                value={searchChats}
                onChange={(event) => setSearchChats(event.target.value)}
              />
            </div>

            {chatsError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {chatsError}
              </div>
            )}

            {/* Conversation List */}
            <div className="space-y-2.5">
              {filteredChats.length === 0 && (
                <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                    <MessageCircle size={22} />
                  </div>
                  <p className="text-sm font-semibold text-zinc-400">No active conversations found</p>
                  <p className="text-xs text-zinc-600">Connect with users in the Friends tab to start chatting!</p>
                  <Button
                    onClick={() => setMainTab('friends')}
                    size="sm"
                    className="mt-2 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white font-bold text-xs"
                  >
                    Go to Friends & Follow
                  </Button>
                </div>
              )}

              {filteredChats.map((chat) => {
                const defaultAvatar = isBoy ? '/female-logo.svg' : '/male-logo.svg';
                const photoVal = chat.photo && chat.photo.trim() && chat.photo !== '/placeholder.svg'
                  ? (apiAssetUrl(chat.photo) || chat.photo)
                  : defaultAvatar;
                const isPinned = Boolean(chat.isPinned);
                const chatSlug = chat.uniqueId || String(chat.userId || '').padStart(6, '0');

                return (
                  <Link key={chat.id} href={`/user/chat/${chatSlug}`}>
                    <div
                      className={`p-4 rounded-2xl bg-[#0D1424]/80 hover:bg-[#0D1424] border transition-all cursor-pointer relative group ${
                        isPinned
                          ? 'border-amber-500/40 bg-amber-500/[0.04]'
                          : 'border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar src={photoVal} alt={chat.name} fallback={chat.name?.[0] || 'U'} className="w-12 h-12 border border-white/10" />
                            {Boolean(chat.online) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0D1424]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white truncate group-hover:text-[#EC4899] transition">
                                {chat.name}
                              </h3>
                              {isPinned && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                  <Pin size={10} className="fill-amber-300 text-amber-300" /> Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-1">
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[11px] text-zinc-500 font-medium mb-1">{chat.lastMessageTime}</p>
                            {Number(chat.unread) > 0 && (
                              <Badge className="bg-[#EC4899] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {Number(chat.unread) > 99 ? '99+' : chat.unread}
                              </Badge>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handlePinToggle(e, chat.id)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              isPinned
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                : 'hover:bg-white/10 text-zinc-500 hover:text-amber-400'
                            }`}
                            title={isPinned ? 'Unpin chat' : 'Pin chat to top'}
                          >
                            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* OPTION 2: FRIENDS (FRNDS) TAB CONTENT */}
        {/* ───────────────────────────────────────────────────────────── */}
        {mainTab === 'friends' && (
          <div className="space-y-6 animate-fade-in">

            {/* 1. FOLLOW STATUS OVERVIEW CARD (Matches User Screenshot Design) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0D1424] to-[#121B30] border border-white/10 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EC4899]/20 to-[#7C3AED]/20 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899] shrink-0 shadow-inner">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                      <span className="text-[#EC4899]">Follow Status</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-bold flex-wrap">
                      <span className="text-purple-400">{following.length} Following</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-pink-400">{followers.length} Followers</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400">{friends.length} Friends 💛</span>
                    </div>
                  </div>
                </div>

                {/* COPY ID Button */}
                {userUniqueIdDisplay && (
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs tracking-wider transition-all cursor-pointer shrink-0 group shadow-sm"
                    title="Click to copy your unique user ID"
                  >
                    <Copy size={13} className="group-hover:scale-110 transition" />
                    <span>{copySuccess ? 'COPIED!' : `COPY ID: ${userUniqueIdDisplay}`}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. SUB-TABS: FOLLOWING | FOLLOWERS | FRIENDS */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 p-1.5 bg-[#0D1424] border border-white/10 rounded-2xl gap-1.5">
                <button
                  type="button"
                  onClick={() => setFriendsSubTab('following')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    friendsSubTab === 'following'
                      ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserCheck size={15} />
                  <span>Following ({following.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFriendsSubTab('followers')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    friendsSubTab === 'followers'
                      ? 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users size={15} />
                  <span>Followers ({followers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFriendsSubTab('friends')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    friendsSubTab === 'friends'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Heart size={15} />
                  <span>Friends ({friends.length}) 💛</span>
                </button>
              </div>

              {/* Search bar inside friends section */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                <Input
                  placeholder={`Search ${friendsSubTab}...`}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder-zinc-500 rounded-2xl focus:border-[#EC4899]/50"
                  value={searchFriends}
                  onChange={(e) => setSearchFriends(e.target.value)}
                />
              </div>

              {/* Users List for Selected Sub-tab */}
              <div className="space-y-2.5">
                {socialLoading ? (
                  <div className="p-12 text-center text-xs text-zinc-400">Loading social network data...</div>
                ) : filteredFriendsList.length === 0 ? (
                  <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                      <Users size={22} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-400">
                      No {friendsSubTab} found
                    </p>
                    <p className="text-xs text-zinc-600">
                      {friendsSubTab === 'following'
                        ? 'Follow users from discover or search to see them here.'
                        : friendsSubTab === 'followers'
                        ? 'When someone follows you, they will appear here.'
                        : 'Mutual followers become friends and enjoy free messaging!'}
                    </p>
                  </div>
                ) : (
                  filteredFriendsList.map((u) => {
                    const uniqueId = String(u.uniqueId || u.unique_id || u.id).replace(/^STK-/i, '').padStart(6, '0');
                    const defaultAvatar = isBoy ? '/female-logo.svg' : '/male-logo.svg';
                    const photoVal = u.photo && String(u.photo).trim()
                      ? (apiAssetUrl(u.photo) || u.photo)
                      : defaultAvatar;
                    const isSelf = currentUser && (Number(u.id) === Number(currentUser.id) || String(u.uniqueId || u.unique_id || '') === String(currentUser.unique_id || ''));

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-[#0D1424]/80 hover:bg-[#0D1424] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        {/* User Basic Info (Clickable to view full profile) */}
                        <div
                          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedUserForProfile(u)}
                        >
                          <div className="relative shrink-0">
                            <Avatar src={photoVal} alt={u.name} fallback={u.name?.[0] || 'U'} className="w-12 h-12 border border-white/10" />
                            {Boolean(u.online) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0D1424]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-white truncate group-hover:text-[#EC4899] transition">
                                {u.name}
                              </h4>
                              {(u.isFriend || friendsSubTab === 'friends') && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                                  🤝 Friends (Free Chat)
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-zinc-400 truncate mt-0.5">ID: {uniqueId}</p>
                          </div>
                        </div>

                        {/* Action Buttons: Chat & Follow Controls */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Direct Message / Chat Button */}
                          {!isSelf && (
                            <Link href={`/user/chat/${uniqueId}`}>
                              <Button
                                type="button"
                                size="sm"
                                className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-[#EC4899] hover:to-[#7C3AED] text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
                                title="Chat with this user"
                              >
                                <MessageCircle size={14} />
                                <span>Chat</span>
                              </Button>
                            </Link>
                          )}

                          {/* Follow / Unfollow / Accept / Decline Buttons */}
                          {isSelf ? (
                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-500 font-extrabold text-xs border border-white/10">
                              You
                            </span>
                          ) : friendsSubTab === 'followers' && u.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleRespondFollowReq(u.requestId, 'accept', u.id)}
                                className="h-9 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs border-0 cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Check size={14} /> Accept
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleRespondFollowReq(u.requestId, 'decline', u.id)}
                                className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-xs border border-white/10 cursor-pointer flex items-center gap-1"
                              >
                                <X size={14} /> Decline
                              </Button>
                            </div>
                          ) : (() => {
                            const isFollowing = friendsSubTab === 'following' || friendsSubTab === 'friends' || Boolean(u.isFriend) || u.myFollowStatus === 'accepted';
                            const isPending = !isFollowing && (u.myFollowStatus === 'pending' || (friendsSubTab === 'followers' && u.status === 'pending'));

                            if (isPending) {
                              return (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleToggleFollowUser(u.id)}
                                  className="h-9 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Clock size={14} /> Requested
                                </Button>
                              );
                            }

                            return (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleToggleFollowUser(u.id)}
                                className={`h-9 px-3.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                                  isFollowing
                                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
                                    : 'bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white border-0 shadow-md'
                                }`}
                              >
                                {isFollowing ? (
                                  <>
                                    <UserCheck size={14} /> Following
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={14} /> Follow
                                  </>
                                )}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

      </Container>

      {/* User Profile View Modal when clicking a card in Friends list */}
      <UserProfileModal
        isOpen={Boolean(selectedUserForProfile)}
        onClose={() => setSelectedUserForProfile(null)}
        userId={selectedUserForProfile?.id}
        initialUser={selectedUserForProfile}
      />
    </div>
  );
}

export default function ChatListPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center min-h-screen flex items-center justify-center bg-[#070B18]">
        <Loading />
      </div>
    }>
      <ChatListContent />
    </Suspense>
  );
}
