'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MobileVerificationPage() {
  const mobileVerified = true;

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
          <h1 className="text-3xl font-bold">Mobile Verification</h1>
        </div>

        {/* Status */}
        <Card className="mb-6">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-500" size={32} />
            </div>
            <p className="text-lg font-semibold mb-2">Mobile Number Verified</p>
            <Badge className="bg-green-500">✓ Verified</Badge>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-4">
              +91 98765 43210
            </p>
          </div>
        </Card>

        {/* Change Number */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Change Mobile Number</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Phone Number</label>
                <Input placeholder="+91" />
              </div>
              <Button>Send OTP</Button>
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-3">Mobile verification ensures:</h3>
            <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>• Account security and recovery options</li>
              <li>• Reduced fake profiles on the platform</li>
              <li>• Two-factor authentication for your account</li>
              <li>• Important notifications and updates</li>
            </ul>
          </div>
        </Card>
      </Container>
    </div>
  );
}
