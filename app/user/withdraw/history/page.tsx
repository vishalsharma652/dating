'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Check, Clock, AlertCircle, ArrowLeft, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';

export default function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [previewProof, setPreviewProof] = useState<{ url: string; title: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkBoyUser = (u: any) => {
      const userGender = String(u?.gender || u?.role || '').toLowerCase();
      const isFemale = ['female', 'woman', 'girl', 'women'].includes(userGender);
      return !isFemale;
    };

    const storedUser = getStoredUser();
    if (storedUser && checkBoyUser(storedUser)) {
      setIsRedirecting(true);
      router.replace('/user/wallet');
      return;
    }

    userApi.profile()
      .then((res) => {
        if (checkBoyUser(res?.user)) {
          setIsRedirecting(true);
          router.replace('/user/wallet');
        }
      })
      .catch(() => undefined);

    userApi.withdrawals()
      .then((data) => setWithdrawals(data.withdrawals || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load withdrawals'))
      .finally(() => setLoading(false));
  }, [router]);

  if (isRedirecting) return <Loader text="Redirecting..." />;

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading withdrawals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header with Back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/user/withdraw"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0"
            title="Back to Withdrawal"
          >
            <ArrowLeft size={18} className="text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Withdrawal History</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">Track all your withdrawal requests and payout receipts</p>
          </div>
        </div>

        <div className="space-y-3">
          {withdrawals.length === 0 && <Card className="p-8 text-center text-zinc-500">No withdrawals found.</Card>}
          {withdrawals.map((withdrawal) => {
            const StatusIcon = withdrawal.status === 'completed' ? Check : withdrawal.status === 'pending' ? Clock : AlertCircle;
            const proofUrl = withdrawal.screenshotUrl || withdrawal.screenshot_url || null;
            const coins = withdrawal.coins ? Number(withdrawal.coins) : Math.round(Number(withdrawal.amount || 0) * 4);

            return (
              <Card key={withdrawal.id} className="p-4 transition hover:border-white/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-500' : withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                      <StatusIcon size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-white">₹{withdrawal.amount}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                          🪙 {coins} Coins
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {withdrawal.method === 'upi' ? '⚡ UPI ID' : '🏦 Bank Transfer'} • <span className="font-mono text-zinc-300">{withdrawal.accountNumber || withdrawal.bankName || 'N/A'}</span>
                      </p>
                      {withdrawal.adminNote && (
                        <p className="text-xs text-zinc-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 inline-block">
                          💬 {withdrawal.adminNote}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested: {withdrawal.requestDate}
                        {withdrawal.completedDate && ` • Completed: ${withdrawal.completedDate}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {proofUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewProof({ url: proofUrl, title: `Payment Proof - ₹${withdrawal.amount}` })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
                      >
                        <ImageIcon size={14} />
                        <span>Payment Proof</span>
                      </button>
                    )}
                    <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'pending' ? 'outline' : 'pink'}>
                      {withdrawal.status === 'completed' ? 'Paid / Completed' : withdrawal.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Proof Lightbox Modal */}
        {previewProof && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPreviewProof(null)}
          >
            <div
              className="relative max-w-lg w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  <h3 className="font-bold text-base text-white">{previewProof.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 transition"
                    title="Open original image"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewProof(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewProof.url}
                  alt="Payment Proof"
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewProof(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
