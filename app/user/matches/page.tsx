'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { matches } from '@/lib/mockData';

export default function MatchesPage() {
  const liked = matches.filter((m) => m.status === 'you_liked');
  const likedYou = matches.filter((m) => m.status === 'liked_you');
  const mutual = matches.filter((m) => m.status === 'matched');

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Your Matches</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          {matches.length} connection{matches.length !== 1 ? 's' : ''}
        </p>

        {/* Mutual Matches */}
        {mutual.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="text-pink-500" size={24} />
              Mutual Matches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mutual.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${match.photo})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute top-3 right-3">Matched</Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{match.name}</h3>
                    <div className="flex gap-2 mb-4">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/user/chat/${match.userId}`}>
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

        {/* Liked You */}
        {likedYou.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Liked You</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {likedYou.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${match.photo})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge variant="pink" className="absolute top-3 right-3">
                      Likes You
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{match.name}</h3>
                    <div className="flex gap-2 mb-4">
                      <Button size="sm" className="flex-1">
                        Like Back
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Pass
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* You Liked */}
        {liked.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">You Liked</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liked.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${match.photo})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge variant="purple" className="absolute top-3 right-3">
                      Waiting
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{match.name}</h3>
                    <p className="text-sm text-zinc-500 mb-4">Waiting for response</p>
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
