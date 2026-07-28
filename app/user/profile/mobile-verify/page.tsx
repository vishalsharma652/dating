'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EmailVerificationStatusPage() {
  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/user/profile">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Email Verification</h1>
        </div>

        {/* Status */}
        <Card className="mb-6">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <p className="text-lg font-semibold mb-2">Email Address Verified</p>
            <Badge className="bg-green-500">✓ Verified</Badge>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
              Your registered email is active and verified for secure access.
            </p>
          </div>
        </Card>

        {/* Info */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-3">Email verification ensures:</h3>
            <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>• Secure account access and password recovery</li>
              <li>• Instant match notifications and coin transaction alerts</li>
              <li>• Protected 1-on-1 user experience on Saathika</li>
            </ul>
          </div>
        </Card>
      </Container>
    </div>
  );
}
