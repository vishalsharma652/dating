'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.matches()
      .then((data) => setMatches(data.matches || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load matches'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading matches...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const mutual = matches.filter((m) => m.status === 'matched');

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Your Matches</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          {matches.length} connection{matches.length !== 1 ? 's' : ''}
        </p>

        {mutual.length === 0 && (
          <Card className="p-8 text-center text-zinc-500">No matches found yet.</Card>
        )}

        {mutual.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="text-pink-500" size={24} />
              Mutual Matches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mutual.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${match.photo || '/placeholder.svg'})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute top-3 right-3">Matched</Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{match.name}</h3>
                    <div className="flex gap-2 mb-4">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/user/chat/${match.profileId || match.userId}`}>
                          <MessageCircle size={16} />
                          Chat
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
