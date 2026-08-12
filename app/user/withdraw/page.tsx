'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { BadgeIndianRupee, Building2, CreditCard, History, Phone, Wallet, ArrowLeft, ShieldAlert, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';

const inputCls =
  'w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-500/20 transition';

export default function WithdrawPage() {
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [formData, setFormData] = useState({
    amount: '',
    mobileNumber: '',
    // UPI fields
    upiId: '',
    // Bank transfer fields
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [wallet, setWallet] = useState<{ coins?: number; earnings?: number; withdrawalBalance?: number }>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
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
        if (res?.user) {
          setUser(res.user);
          if (checkBoyUser(res.user)) {
            setIsRedirecting(true);
            router.replace('/user/wallet');
          }
        }
      })
      .catch(() => undefined);

    userApi.wallet().catch(() => undefined).then((data: any) => {
      if (data) setWallet(data);
    });
  }, [router]);

  if (isRedirecting) return <Loader text="Redirecting..." />;

  const set = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await userApi.createWithdrawal({
        amount: Number(formData.amount),
        method,
        mobileNumber: formData.mobileNumber,
        ...(method === 'upi'
          ? { bankName: 'UPI', accountNumber: formData.upiId }
          : {
              accountHolderName: formData.accountHolderName,
              bankName: formData.bankName,
              accountNumber: formData.accountNumber,
              ifscCode: formData.ifscCode,
            }),
      });
      setMessage('✅ Withdrawal request submitted successfully. We will process it within 1-3 business days.');
      setFormData({ amount: '', mobileNumber: '', upiId: '', accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const totalCoins = Number(wallet.coins ?? wallet.earnings ?? wallet.withdrawalBalance ?? 0);
  const availableRupees = (totalCoins * 0.25).toFixed(2);
  const reqCoins = Number(formData.amount || 0) * 4;

  return (
    <div className="p-4 md:p-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/user/dashboard"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} className="text-zinc-300" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Withdrawal</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Withdraw your earnings to your bank or UPI account</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-200 dark:border-pink-900/40 px-4 py-2">
              <Wallet size={18} className="text-pink-500" />
              <span className="text-sm font-medium">Earned Coins:</span>
              <span className="font-bold text-pink-600">{totalCoins} Coins</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-900/40 px-4 py-2">
              <BadgeIndianRupee size={18} className="text-emerald-500" />
              <span className="text-sm font-medium">Available Balance (50% Rate):</span>
              <span className="font-bold text-emerald-400">₹ {availableRupees}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-semibold">
            💡 Rate Condition: 200 Coins = ₹50 INR (1 Coin = ₹0.25). 50% purchase package conversion rate applied.
          </p>
        </div>

        <Card className="mb-6">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BadgeIndianRupee size={20} className="text-pink-500" />
              Request Withdrawal
            </h2>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="Enter amount (Min: ₹50)"
                value={formData.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={inputCls}
                min={50}
              />
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-1.5 font-medium">
                <span>Minimum withdrawal: ₹50 (200 Coins)</span>
                {reqCoins > 0 && (
                  <span className="text-pink-400 font-bold">
                    Deduction: {reqCoins} Coins
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-zinc-400" /> Registered Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.mobileNumber}
                onChange={(e) => set('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={inputCls}
              />
              <p className="text-xs text-zinc-400 mt-1">This is used to verify and process your payment.</p>
            </div>

            {/* Payment Method Toggle */}
            <div>
              <label className="block text-sm font-medium mb-3">Payment Method <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'upi', label: 'UPI', subtitle: 'Instant', icon: '⚡' },
                  { value: 'bank_transfer', label: 'Bank Transfer', subtitle: '1–2 days', icon: '🏦' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMethod(opt.value as any)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      method === opt.value
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-zinc-500">{opt.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI Fields */}
            {(() => {
              const kycStatus = String(user?.kyc_status || user?.kycStatus || '').toLowerCase();
              const isKycApproved = kycStatus === 'approved' || kycStatus === 'verified' || user?.kyc_approved === true || user?.is_verified === true;

              if (method === 'upi') {
                if (!isKycApproved) {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                        <ShieldAlert size={18} />
                        <span>KYC Verification Required for UPI Withdrawals</span>
                      </div>
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        UPI ID se withdrawal request submit karne ke liye aapka KYC Verified (Approved) hona compulsory hai. Pehle Profile me jaakar KYC complete karein.
                      </p>
                      <Link
                        href="/user/profile"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs transition shadow cursor-pointer mt-1"
                      >
                        Complete KYC Verification <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  );
                }
                return (
                  <div>
                    <label className="block text-sm font-medium mb-2">UPI ID <span className="text-red-500">*</span></label>
                    <input
                      placeholder="yourname@upi"
                      value={formData.upiId}
                      onChange={(e) => set('upiId', e.target.value)}
                      className={inputCls}
                    />
                    <p className="text-xs text-zinc-400 mt-1">e.g. 9876543210@paytm, name@okaxis</p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Bank Transfer Fields */}
            {method === 'bank_transfer' && (
              <div className="space-y-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Building2 size={16} className="text-pink-500" /> Bank Account Details
                </p>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Account Holder Name <span className="text-red-500">*</span></label>
                  <input
                    placeholder="Full name as on bank account"
                    value={formData.accountHolderName}
                    onChange={(e) => set('accountHolderName', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Bank Name <span className="text-red-500">*</span></label>
                  <input
                    placeholder="e.g. SBI, HDFC, ICICI"
                    value={formData.bankName}
                    onChange={(e) => set('bankName', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                    <CreditCard size={12} /> Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Enter bank account number"
                    value={formData.accountNumber}
                    onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, ''))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                  <input
                    placeholder="e.g. SBIN0001234"
                    value={formData.ifscCode}
                    onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
                    className={inputCls}
                    maxLength={11}
                  />
                </div>
              </div>
            )}

            {message && (
              <p className="rounded-lg bg-green-500/10 border border-green-200 dark:border-green-900/40 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                {message}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {(() => {
              const kycStatus = String(user?.kyc_status || user?.kycStatus || '').toLowerCase();
              const isKycApproved = kycStatus === 'approved' || kycStatus === 'verified' || user?.kyc_approved === true || user?.is_verified === true;
              if (method === 'upi' && !isKycApproved) {
                return null;
              }
              return (
                <Button
                  className="w-full h-12 text-base"
                  onClick={submit}
                  disabled={
                    loading ||
                    !formData.amount ||
                    !formData.mobileNumber ||
                    (method === 'upi'
                      ? !formData.upiId
                      : (!formData.accountNumber || !formData.ifscCode || !formData.bankName))
                  }
                >
                  <BadgeIndianRupee size={18} />
                  {loading ? 'Submitting...' : 'Request Withdrawal'}
                </Button>
              );
            })()}
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
              <Link href="/user/withdraw/history">
                <History size={18} />
                View Withdrawal History
              </Link>
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  );
}
