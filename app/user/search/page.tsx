'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, ShieldCheck, MapPin, Briefcase, Calendar, UserCheck, Gem, Coins, Sparkles } from 'lucide-react';
import { userApi, getStoredUser, apiAssetUrl } from '@/lib/api';
import Loading from '@/app/loading';
import { SayHiModal } from '@/components/user/say-hi-modal';

export default function UserSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [sayHiTarget, setSayHiTarget] = useState<any>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingChatUserIds, setExistingChatUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setCurrentUser(getStoredUser());
    userApi.chats()
      .then((res) => {
        const ids = new Set<number>((res?.chats || []).map((c: any) => Number(c.userId || c.user_id || c.id)));
        setExistingChatUserIds(ids);
      })
      .catch(() => undefined);
  }, []);

  const isBoy = String(currentUser?.gender || '').toLowerCase() === 'male';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const data = await userApi.searchUsers(cleanQuery);
      setResults(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Container>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Search Profile by Unique ID</h1>
          <p className="text-zinc-400 mt-1">
            Search any user using their Unique ID (e.g. #5, 12) or Name to view their full profile details.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <Input
              type="text"
              placeholder="Enter Unique User ID (e.g. #12, 5) or Name..."
              className="pl-12 h-12 bg-white/5 border-white/10 text-white rounded-xl text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 px-6 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-90 font-semibold rounded-xl" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {error && <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}

        {/* Results Section */}
        {loading && (
          <Loading />
        )}

        {!loading && searched && results.length === 0 && (
          <Card className="p-12 text-center text-zinc-400 bg-white/5 border-white/10">
            No user profile found matching &quot;{query}&quot;. Try searching with another Unique ID or Name.
          </Card>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm font-semibold text-zinc-400">Found {results.length} matching profile{results.length !== 1 ? 's' : ''}:</p>
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((user) => {
                const defaultAvatar = isBoy ? '/avatar-priya.jpg' : '/avatar-boy1.jpg';
                const photoVal = user.photo && user.photo.trim() && user.photo !== '/placeholder.svg'
                  ? (apiAssetUrl(user.photo) || user.photo)
                  : defaultAvatar;

                const isFemaleUser = ['female', 'woman', 'girl', 'women'].includes(String(user.gender || '').toLowerCase());
                const IconSymbol = isFemaleUser ? Gem : Coins;
                const genderBadgeColor = isFemaleUser
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                const displayId = user.unique_id;

                return (
                  <Card key={user.id} className="p-6 bg-[#0D1120] border-white/10 text-white rounded-2xl shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Header Info */}
                      <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                        <div className="relative">
                          <Avatar src={photoVal} alt={user.name} className="w-16 h-16 rounded-2xl border-2 border-white/10" fallback={user.name?.[0] || 'U'} />
                          {Boolean(user.online_status) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0D1120]" title="Online" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold truncate">{user.name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${genderBadgeColor} inline-flex items-center gap-1.5`}>
                              <IconSymbol size={13} className="shrink-0" />
                              <span>{user.gender ? user.gender.toUpperCase() : 'MEMBER'}</span>
                            </span>
                            {user.kyc_status === 'approved' && (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                                <ShieldCheck size={12} /> Verified KYC
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 text-xs">
                              ID {displayId}
                            </span>
                            <span>&bull;</span>
                            <span className="text-xs text-zinc-400">User #{user.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Full User Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <span className="text-zinc-400 text-xs block">Unique ID</span>
                          <strong className="text-emerald-400 font-mono text-base">{displayId}</strong>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <span className="text-zinc-400 text-xs block">Activity Status</span>
                          <span className={`font-semibold ${user.online_status ? 'text-green-400' : 'text-zinc-400'}`}>
                            {user.online_status ? '🟢 Online Now' : '🔴 Offline'}
                          </span>
                        </div>

                        <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2.5">
                          <MapPin size={16} className="text-pink-400 shrink-0" />
                          <div>
                            <span className="text-zinc-400 text-xs block">Location</span>
                            <span className="font-medium text-white">{user.city || user.location || 'Not specified'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2.5">
                          <Briefcase size={16} className="text-purple-400 shrink-0" />
                          <div>
                            <span className="text-zinc-400 text-xs block">Occupation</span>
                            <span className="font-medium text-white">{user.occupation || 'Private Professional'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2.5">
                          <UserCheck size={16} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-400 text-xs block">Gender &amp; Badge</span>
                            <span className="font-bold text-white flex items-center gap-1.5 capitalize">
                              <IconSymbol size={14} className="shrink-0" />
                              <span>{user.gender || 'Member'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 rounded-xl flex items-center gap-2.5">
                          <Calendar size={16} className="text-amber-400 shrink-0" />
                          <div>
                            <span className="text-zinc-400 text-xs block">Joined Date</span>
                            <span className="font-medium text-white">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Member'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <div className="p-3 bg-white/5 rounded-xl text-sm">
                          <span className="text-zinc-400 text-xs block mb-1">About Bio</span>
                          <p className="text-zinc-200 leading-relaxed italic">&quot;{user.bio}&quot;</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                      {existingChatUserIds.has(Number(user.id)) ? (
                        <Button
                          asChild
                          className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 font-semibold rounded-xl gap-2 cursor-pointer"
                        >
                          <Link href={`/user/chat/${user.id}`}>
                            <MessageSquare size={16} /> Open Chat 💬
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => setSayHiTarget({ id: user.id, name: user.name, photo: photoVal, location: user.city })}
                          className="flex-1 h-11 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:opacity-90 font-semibold rounded-xl gap-2 cursor-pointer"
                        >
                          <Sparkles size={16} /> Say Hi 👋 with #{user.id}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      <SayHiModal
        isOpen={Boolean(sayHiTarget)}
        onClose={() => setSayHiTarget(null)}
        targetUser={sayHiTarget}
        currentCoins={currentUser?.coins}
      />
    </div>
  );
}
