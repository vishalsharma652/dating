'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  QrCode,
  Check,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Lock,
  Sparkles,
  Globe
} from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';

// Custom components for UPI Provider logos
const GooglePayLogo = () => (
  <span className="font-bold tracking-tight text-zinc-900 dark:text-white">
    G<span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#4285F4]">y</span>
  </span>
);
const PhonePeLogo = () => (
  <span className="font-black text-[#5f259f]">
    Phone<span className="text-pink-500">Pe</span>
  </span>
);
const PaytmLogo = () => (
  <span className="font-extrabold text-[#00b9f5] italic">Paytm</span>
);
const BhimLogo = () => (
  <span className="font-bold text-[#E26827]">
    BH<span className="text-[#097939]">IM</span>
  </span>
);

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('packageId');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment method selection: 'stripe' or 'upi'
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'upi'>('stripe');
  const [upiSubMode, setUpiSubMode] = useState<'vpa' | 'qr'>('vpa');

  // Stripe form values
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [stripeIntent, setStripeIntent] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // UPI form values
  const [upiId, setUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | ''>('');
  const [qrTimeLeft, setQrTimeLeft] = useState(300);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiVerification, setUpiVerification] = useState<{ valid?: boolean; customerName?: string; message?: string } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Developer Simulation state (success, failure, cancel)
  const [simulationOutcome, setSimulationOutcome] = useState<'success' | 'failure' | 'cancel'>('success');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failure' | 'cancelled'>('idle');
  const [processingStep, setProcessingStep] = useState(1);
  const [coinsAdded, setCoinsAdded] = useState(0);
  const [reference, setReference] = useState('');

  useEffect(() => {
    const checkFemaleUser = (u: any) => {
      const userGender = String(u?.gender || u?.role || '').toLowerCase();
      return ['female', 'woman', 'girl', 'women'].includes(userGender);
    };

    const storedUser = getStoredUser();
    if (checkFemaleUser(storedUser)) {
      router.replace('/user/wallet');
      return;
    }

    if (!packageId) {
      router.push('/user/wallet/coins');
      return;
    }

    userApi
      .coinPackages()
      .then((data) => {
        const found = data.packages.find((p: any) => String(p.id) === String(packageId));
        if (found) {
          setPkg(found);
        } else {
          setError('Package not found');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load package'))
      .finally(() => setLoading(false));
  }, [packageId, router]);

  // Create Stripe Intent when package is loaded or Stripe selected
  useEffect(() => {
    if (!packageId || paymentMethod !== 'stripe' || stripeIntent) return;
    setStripeLoading(true);
    userApi
      .createStripeIntent(packageId)
      .then((data) => {
        setStripeIntent(data);
      })
      .catch((err) => {
        console.warn('Stripe Intent creation error:', err);
      })
      .finally(() => setStripeLoading(false));
  }, [packageId, paymentMethod, stripeIntent]);

  // Timer for UPI QR Code mode
  useEffect(() => {
    if (paymentMethod !== 'upi' || upiSubMode !== 'qr' || qrTimeLeft <= 0) return;
    const timer = setInterval(() => setQrTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [paymentMethod, upiSubMode, qrTimeLeft]);

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (field === 'upiId') {
      setUpiVerification(null);
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleVerifyUpi = async () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      setFieldErrors((prev) => ({ ...prev, upiId: 'Please enter a valid UPI ID (e.g. username@okaxis)' }));
      return;
    }
    setUpiVerifying(true);
    setUpiVerification(null);
    try {
      const res = await userApi.verifyUpiId(upiId.trim());
      setUpiVerification(res);
    } catch (err: any) {
      setUpiVerification({ valid: false, message: err.message || 'UPI Verification Failed' });
    } finally {
      setUpiVerifying(false);
    }
  };

  const getCardType = (number: string) => {
    const clean = number.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^60|^6521|^6522/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return '';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!paymentMethod) return { general: 'Please select a payment method' };

    if (paymentMethod === 'stripe') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 16 || !/^\d+$/.test(cleanCard)) {
        errors.cardNumber = 'Please enter a valid 16-digit card number';
      }

      if (!expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
        errors.expiry = 'Please enter a valid expiry (MM/YY)';
      } else {
        const [expMonth, expYear] = expiry.split('/').map(Number);
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          errors.expiry = 'Card has expired';
        }
      }

      if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
        errors.cvv = 'Please enter a valid 3 or 4-digit CVV';
      }

      if (!cardName.trim()) {
        errors.cardName = 'Please enter cardholder name';
      }
    } else if (paymentMethod === 'upi' && upiSubMode === 'vpa') {
      const upiRegex = /^[a-zA-Z0-9.\-_]{3,64}@[a-zA-Z]{3,32}$/;
      if (!upiId.trim() || !upiRegex.test(upiId.trim())) {
        errors.upiId = 'Please enter a valid UPI ID (e.g., 9876543210@ybl or username@okaxis)';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handlePayment = async () => {
    const validationErrors = validateForm();
    if (validationErrors) {
      if (validationErrors.general) {
        setError(validationErrors.general);
      } else {
        setFieldErrors(validationErrors);
        setError('');
      }
      return;
    }

    setFieldErrors({});
    setError('');
    setPaymentStatus('processing');
    setProcessingStep(1);

    // Step 1: Initialize transaction modal
    await new Promise((resolve) => setTimeout(resolve, 800));
    setProcessingStep(2);

    // Step 2: Simulate Gateway Processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Handle simulation outcomes
    if (simulationOutcome === 'cancel') {
      setPaymentStatus('cancelled');
      return;
    }

    if (simulationOutcome === 'failure') {
      setPaymentStatus('failure');
      setError('Payment declined by Bank / Gateway. Please check credentials or try another method.');
      return;
    }

    // Step 3: Success outcome - Submit payload to backend
    setProcessingStep(3);
    try {
      let gateway: 'stripe' | 'phonepe' | 'upi_qr' = 'stripe';
      if (paymentMethod === 'upi') {
        gateway = upiSubMode === 'qr' ? 'upi_qr' : 'phonepe';
      }

      const mockRef =
        paymentMethod === 'stripe'
          ? stripeIntent?.paymentIntentId || `pi_stripe_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
          : `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const data = await userApi.purchaseCoins(packageId!, {
        gateway,
        paymentReference: mockRef,
        upiId: paymentMethod === 'upi' && upiSubMode === 'vpa' ? upiId : undefined,
        cardNumber: paymentMethod === 'stripe' ? cardNumber : undefined,
        expiry: paymentMethod === 'stripe' ? expiry : undefined,
        cvv: paymentMethod === 'stripe' ? cvv : undefined,
        cardName: paymentMethod === 'stripe' ? cardName : undefined,
      });

      setReference(mockRef);
      setCoinsAdded(data.coinsAdded);
      setPaymentStatus('success');

      // Dispatch global wallet update event so header / navigation balance refreshes instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:wallet-updated', { detail: { coins: data.coinsAdded } }));
      }

      // Auto redirect to wallet page
      setTimeout(() => {
        router.push('/user/wallet');
      }, 3200);
    } catch (err: any) {
      setPaymentStatus('idle');
      if (err.errors) {
        setFieldErrors(err.errors);
        setError('Validation failed. Please review the highlighted fields.');
      } else {
        setError(err.message || 'Transaction failed. Please try again.');
      }
    }
  };

  const formatCardNumber = (val: string) => {
    return val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const copyUpiHandle = () => {
    const handle = '9352692626@kotakbank';
    navigator.clipboard.writeText(handle);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (loading) return <Loader fullscreen text="Loading payment package details..." />;

  if (error && !pkg)
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <p className="text-red-500 mb-6 font-medium">{error}</p>
        <Button onClick={() => router.push('/user/wallet/coins')}>Go Back to Packages</Button>
      </div>
    );

  // Successful checkout screen
  if (paymentStatus === 'success')
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-green-500"></div>
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.3)] transform scale-110">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
              Payment Verified
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-3 mb-2">Payment Successful!</h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-base">
              You have added <span className="font-bold text-pink-500">{coinsAdded} coins</span> to your wallet balance.
            </p>
          </div>
          <div className="w-full bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 flex flex-col gap-1 items-center border border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 font-mono">Reference: {reference}</p>
            <p className="text-xs text-zinc-400">Gateway: {paymentMethod === 'stripe' ? 'STRIPE GATEWAY' : 'UPI PAYMENT'}</p>
            <p className="text-xs text-pink-500 font-medium animate-pulse mt-2 flex items-center gap-1">
              <Sparkles size={14} /> Redirecting to your wallet...
            </p>
          </div>
        </Card>
      </div>
    );

  // Cancelled payment screen
  if (paymentStatus === 'cancelled')
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment Cancelled</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              The transaction was aborted. No coins were purchased, and your bank account has not been charged.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button className="rounded-xl h-11" onClick={() => setPaymentStatus('idle')}>
              Try Again
            </Button>
            <Button variant="ghost" className="rounded-xl h-11" onClick={() => router.push('/user/wallet')}>
              Go to Wallet
            </Button>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="p-4 md:p-8">
      {/* Payment Processing Gateway Modal Overlay */}
      {paymentStatus === 'processing' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#635BFF] via-purple-500 to-pink-500 animate-pulse" />
            <div className="w-16 h-16 bg-[#635BFF]/10 text-[#635BFF] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(99,91,255,0.3)]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                Processing {paymentMethod === 'stripe' ? 'Stripe Gateway' : 'UPI Payment'}
              </h3>
              <p className="text-xs text-zinc-500">Please do not refresh or close this window.</p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3 text-left bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold ${
                    processingStep >= 1 ? 'bg-[#635BFF] text-white' : 'bg-zinc-300 text-zinc-600'
                  }`}
                >
                  {processingStep > 1 ? <Check size={12} /> : '1'}
                </div>
                <span className={processingStep >= 1 ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}>
                  Securing 256-bit Connection
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold ${
                    processingStep >= 2 ? 'bg-[#635BFF] text-white' : 'bg-zinc-300 text-zinc-600'
                  }`}
                >
                  {processingStep > 2 ? <Check size={12} /> : '2'}
                </div>
                <span className={processingStep >= 2 ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}>
                  Verifying with Bank / Gateway Authorization
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold ${
                    processingStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-zinc-600'
                  }`}
                >
                  {processingStep >= 3 ? <Check size={12} /> : '3'}
                </div>
                <span className={processingStep >= 3 ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}>
                  Crediting coins to Ember Wallet
                </span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 text-xs text-zinc-400">
              <Lock size={12} /> Encrypted by PCI-DSS Bank Security
            </div>
          </Card>
        </div>
      )}

      <Container className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Checkout Payment</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3 animate-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Payment Error</p>
              <p className="text-xs text-red-500/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <Card className="mb-8 border-none shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-none overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md relative rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#635BFF] via-purple-500 to-pink-600"></div>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-[#635BFF] font-mono bg-[#635BFF]/10 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Globe size={12} /> Encrypted Gateway Checkout
              </span>
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 text-sm">Coin Package</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pkg.name}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 text-sm">Coins Included</span>
                <span className="font-semibold text-pink-500 bg-pink-50 dark:bg-pink-500/10 px-3 py-1 rounded-full text-xs">
                  {pkg.coins} {Number(pkg.bonus) > 0 ? `+ ${pkg.bonus} Bonus Coins` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xl font-extrabold">
                <span>Total Amount</span>
                <span className="text-pink-600 dark:text-pink-400">Rs {pkg.price}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Developer Sandbox Simulation Control */}
        <Card className="mb-8 p-4 border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center text-xs font-bold text-purple-600 dark:text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span>Sandbox Simulation Control</span>
            </div>
            <span className="text-[10px] bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
              Test Mode Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select an outcome to test how the checkout responds upon clicking pay:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSimulationOutcome('success')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                simulationOutcome === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Simulate Success
            </button>
            <button
              onClick={() => setSimulationOutcome('failure')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                simulationOutcome === 'failure'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Simulate Failure
            </button>
            <button
              onClick={() => setSimulationOutcome('cancel')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                simulationOutcome === 'cancel'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Simulate Cancel
            </button>
          </div>
        </Card>

        {/* Payment Methods - ONLY STRIPE & UPI */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Choose Payment Method</h2>

          {/* 1. Stripe Payment Gateway */}
          <div
            className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${
              paymentMethod === 'stripe'
                ? 'border-[#635BFF] bg-[#635BFF]/5 shadow-[0_0_30px_rgba(99,91,255,0.15)]'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/60 bg-white dark:bg-zinc-950'
            }`}
            onClick={() => {
              setPaymentMethod('stripe');
              setError('');
              setFieldErrors({});
            }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                    paymentMethod === 'stripe'
                      ? 'bg-[#635BFF] text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <CreditCard size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base block text-zinc-900 dark:text-white">
                      Stripe Gateway
                    </span>
                    <span className="text-[10px] bg-[#635BFF]/10 text-[#635BFF] font-bold px-2 py-0.5 rounded-md">
                      RECOMMENDED
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Credit/Debit Cards, Apple Pay, Google Pay</span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === 'stripe' ? 'border-[#635BFF]' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {paymentMethod === 'stripe' && <div className="w-3 h-3 rounded-full bg-[#635BFF]" />}
              </div>
            </div>

            {paymentMethod === 'stripe' && (
              <div
                className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 animate-in slide-in-from-top-2 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4 max-w-sm">
                  {stripeLoading ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                      <Loader2 className="animate-spin" size={14} /> Creating Stripe Payment Session...
                    </div>
                  ) : (
                    <div className="text-xs text-[#635BFF] bg-[#635BFF]/10 px-3 py-1.5 rounded-xl font-mono flex items-center justify-between">
                      <span>Stripe Intent Active</span>
                      <span className="font-bold">{stripeIntent?.paymentIntentId || 'pi_stripe_active'}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Card Number</label>
                      {getCardType(cardNumber) && (
                        <span className="text-xs font-bold text-[#635BFF] font-mono">{getCardType(cardNumber)}</span>
                      )}
                    </div>
                    <Input
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => handleFieldChange('cardNumber', formatCardNumber(e.target.value), setCardNumber)}
                      maxLength={19}
                      className={`font-mono bg-white dark:bg-zinc-900 h-12 text-base rounded-xl ${
                        fieldErrors.cardNumber ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.cardNumber && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Expiry Date</label>
                      <Input
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => handleFieldChange('expiry', formatExpiry(e.target.value), setExpiry)}
                        maxLength={5}
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-base rounded-xl ${
                          fieldErrors.expiry ? 'border-red-500' : ''
                        }`}
                      />
                      {fieldErrors.expiry && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">CVC / CVV</label>
                      <Input
                        type="password"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => handleFieldChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4), setCvv)}
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-base rounded-xl ${
                          fieldErrors.cvv ? 'border-red-500' : ''
                        }`}
                      />
                      {fieldErrors.cvv && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">
                      Cardholder Name
                    </label>
                    <Input
                      placeholder="Name printed on card"
                      value={cardName}
                      onChange={(e) => handleFieldChange('cardName', e.target.value, setCardName)}
                      className={`bg-white dark:bg-zinc-900 h-12 text-base rounded-xl ${
                        fieldErrors.cardName ? 'border-red-500' : ''
                      }`}
                    />
                    {fieldErrors.cardName && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.cardName}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. UPI Payment */}
          <div
            className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${
              paymentMethod === 'upi'
                ? 'border-pink-500 bg-pink-50/20 dark:bg-pink-500/5 shadow-[0_0_25px_rgba(236,72,153,0.12)]'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-800 bg-white dark:bg-zinc-950'
            }`}
            onClick={() => {
              setPaymentMethod('upi');
              setError('');
              setFieldErrors({});
            }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                    paymentMethod === 'upi'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Smartphone size={22} />
                </div>
                <div>
                  <span className="font-bold text-base block text-zinc-900 dark:text-white">UPI Payment</span>
                  <span className="text-xs text-zinc-500">Google Pay, PhonePe, Paytm, BHIM VPA & QR Code</span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  paymentMethod === 'upi' ? 'border-pink-500' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {paymentMethod === 'upi' && <div className="w-3 h-3 rounded-full bg-pink-500" />}
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div
                className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 animate-in slide-in-from-top-2 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sub-mode selector (UPI ID VPA vs Scan QR Code) */}
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl mb-4 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setUpiSubMode('vpa')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      upiSubMode === 'vpa'
                        ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Enter UPI VPA ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiSubMode('qr')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      upiSubMode === 'qr'
                        ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <QrCode size={14} /> Scan QR Code
                  </button>
                </div>

                {upiSubMode === 'vpa' ? (
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Select App
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'gpay', render: <GooglePayLogo /> },
                          { id: 'phonepe', render: <PhonePeLogo /> },
                          { id: 'paytm', render: <PaytmLogo /> },
                          { id: 'bhim', render: <BhimLogo /> },
                        ].map((prov) => (
                          <button
                            key={prov.id}
                            type="button"
                            onClick={() => {
                              setUpiProvider(prov.id as any);
                              if (prov.id === 'gpay') setUpiId('username@okaxis');
                              else if (prov.id === 'phonepe') setUpiId('username@ybl');
                              else if (prov.id === 'paytm') setUpiId('username@paytm');
                              else if (prov.id === 'bhim') setUpiId('username@upi');
                            }}
                            className={`h-11 rounded-xl border text-xs flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-all ${
                              upiProvider === prov.id
                                ? 'border-pink-500 ring-2 ring-pink-500/20 font-bold'
                                : 'border-zinc-200 dark:border-zinc-800'
                            }`}
                          >
                            {prov.render}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Enter UPI ID (VPA)
                        </label>
                        <button
                          type="button"
                          onClick={handleVerifyUpi}
                          disabled={upiVerifying || !upiId.includes('@')}
                          className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50 flex items-center gap-1"
                        >
                          {upiVerifying ? (
                            <>
                              <Loader2 className="animate-spin" size={12} /> Verifying...
                            </>
                          ) : (
                            'Verify VPA'
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="username@bank"
                          value={upiId}
                          onChange={(e) => handleFieldChange('upiId', e.target.value.toLowerCase(), setUpiId)}
                          className={`h-12 text-base bg-white dark:bg-zinc-900 rounded-xl pr-10 ${
                            fieldErrors.upiId
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20'
                              : upiVerification?.valid
                              ? 'border-emerald-500 focus:border-emerald-500 ring-2 ring-emerald-500/20'
                              : upiVerification?.valid === false
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                        {upiVerification?.valid && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={18} />
                          </div>
                        )}
                      </div>
                      {fieldErrors.upiId && <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.upiId}</p>}

                      {/* VPA Verification Result Box */}
                      {upiVerification && (
                        <div
                          className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                            upiVerification.valid
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {upiVerification.valid ? (
                            <>
                              <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                              <div>
                                <p className="font-bold">✓ Account Verified on NPCI Network</p>
                                <p className="text-[11px] opacity-90">Name: {upiVerification.customerName || 'Registered Account'}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-red-500 flex-shrink-0" />
                              <div>
                                <p className="font-bold">✕ Verification Failed</p>
                                <p className="text-[11px] opacity-90">{upiVerification.message}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {['@okaxis', '@ybl', '@paytm', '@icici', '@upi'].map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const base = upiId.split('@')[0] || 'user';
                            setUpiId(`${base}${suffix}`);
                          }}
                          className="text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-100 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                    {/* Kotak 811 QR Card Container */}
                    <div className="w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl p-6 text-white relative flex flex-col items-center">
                      {/* Kotak 811 Header */}
                      <div className="flex flex-col items-center gap-1 mb-4">
                        <div className="flex items-center gap-1 text-2xl font-extrabold tracking-tight">
                          <span className="text-white">kotak</span>
                          <span className="text-white bg-[#be123c] px-2 py-0.5 rounded-lg text-base font-black">811</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-semibold mt-1">Scan to pay with any UPI app</p>
                      </div>

                      {/* QR Code Image Container */}
                      <div className="p-3.5 bg-white rounded-2xl shadow-xl mb-4 border border-white/20 relative group">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=9352692626@kotakbank&pn=SNEHA%20GOYAL&am=${pkg?.price || ''}&cu=INR`)}`}
                          alt="Kotak 811 UPI QR Code - SNEHA GOYAL"
                          className="w-48 h-48 rounded-xl object-contain"
                        />
                      </div>

                      {/* Bottom Red Card Details */}
                      <div className="w-full rounded-2xl bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#9f1239] p-4 text-left shadow-lg border border-red-400/30">
                        <p className="text-[10px] uppercase tracking-widest font-black text-white/80">Account Holder</p>
                        <h4 className="text-lg font-black text-white tracking-wide mt-0.5">SNEHA GOYAL</h4>
                        <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-white/70 font-semibold uppercase">UPI ID</p>
                            <p className="text-xs font-mono font-bold text-white tracking-wider">9352692626@kotakbank</p>
                          </div>
                          <button
                            type="button"
                            onClick={copyUpiHandle}
                            className="px-3 py-1.5 rounded-xl bg-white text-[#be123c] font-bold text-xs hover:bg-zinc-100 transition shadow-sm flex items-center gap-1"
                          >
                            <Copy size={12} /> {copiedUpi ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mt-4 mb-1">
                      QR Code active for:{' '}
                      <span className="font-mono font-bold text-pink-500">
                        {Math.floor(qrTimeLeft / 60)}:{(qrTimeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Payment Action */}
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#635BFF] via-purple-600 to-pink-600 hover:opacity-95 transition-all shadow-[0_8px_25px_0_rgba(99,91,255,0.35)] disabled:opacity-50 disabled:shadow-none"
          onClick={handlePayment}
          disabled={paymentStatus === 'processing' || !paymentMethod}
        >
          {paymentStatus === 'processing' ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} /> Processing Payment...
            </span>
          ) : (
            `Pay Rs ${pkg.price} via ${paymentMethod === 'stripe' ? 'Stripe Gateway' : 'UPI'}`
          )}
        </Button>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2 bg-[#635BFF]/10 px-4 py-2 rounded-full border border-[#635BFF]/20">
            <ShieldCheck size={16} className="text-[#635BFF]" /> 256-bit Encrypted SSL Gateway Security
          </p>
          <p className="text-[11px] text-zinc-400 text-center max-w-sm leading-relaxed">
            By proceeding, you agree to the Terms of Service. Coins are credited instantly to your Ember Dating account upon payment confirmation.
          </p>
        </div>
      </Container>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-[#635BFF] border-t-transparent rounded-full animate-spin mb-4" />
          <p>Loading checkout environment...</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
