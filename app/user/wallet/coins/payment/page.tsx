'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Smartphone, Check, ShieldCheck } from 'lucide-react';
import { userApi } from '@/lib/api';

const AppleLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 384 512" fill="currentColor" width="24" height="24">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('packageId');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card' | 'upi' | ''>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [upiId, setUpiId] = useState('');
  const [saveUpi, setSaveUpi] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coinsAdded, setCoinsAdded] = useState(0);

  useEffect(() => {
    if (!packageId) {
      router.push('/user/wallet/coins');
      return;
    }

    userApi.coinPackages()
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!paymentMethod) return { general: 'Please select a payment method' };
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) errors.cardNumber = 'Please enter a valid card number';
      if (!expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) errors.expiry = 'Please enter a valid expiry date (MM/YY)';
      if (cvv.length < 3) errors.cvv = 'Please enter a valid CVV';
    }
    if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) errors.upiId = 'Please enter a valid UPI ID';
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
    setProcessing(true);
    setError('');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      let gateway: 'razorpay' | 'cashfree' | 'phonepe' = 'razorpay';
      if (paymentMethod === 'apple_pay') gateway = 'cashfree';
      else if (paymentMethod === 'upi') gateway = 'phonepe';

      const data = await userApi.purchaseCoins(packageId!, {
        gateway,
        paymentReference: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      });

      setSuccess(true);
      setCoinsAdded(data.coinsAdded);
      
      // Redirect back to wallet after success
      setTimeout(() => {
        router.push('/user/wallet');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  const formatCardNumber = (val: string) => {
    return val.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };
  
  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" /><p>Loading payment details...</p></div>;

  if (error && !pkg) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <p className="text-red-500 mb-6 font-medium">{error}</p>
      <Button onClick={() => router.push('/user/wallet/coins')}>Go Back to Packages</Button>
    </div>
  );

  if (success) return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)] transform scale-110">
          <Check className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-lg">
            You have successfully purchased <span className="font-bold text-pink-500">{coinsAdded} coins</span>.
          </p>
        </div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 flex flex-col gap-1 items-center">
          <p className="text-sm text-zinc-500">Reference: PAY-{Date.now().toString().slice(-6)}</p>
          <p className="text-sm text-zinc-500 font-medium animate-pulse mt-2">Redirecting to your wallet...</p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <Container className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Complete Payment</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <Card className="mb-8 border-none shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-none overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-500">Package</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{pkg.name}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-500">Coins</span>
                <span className="font-medium text-pink-500 bg-pink-50 dark:bg-pink-500/10 px-3 py-1 rounded-full">{pkg.coins} {Number(pkg.bonus) > 0 ? `+ ${pkg.bonus} Bonus` : ''}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-xl font-bold">
                <span>Total Amount</span>
                <span>Rs {pkg.price}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
          
          {/* Apple Pay Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'apple_pay' ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('apple_pay'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'apple_pay' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <AppleLogo />
                </div>
                <span className="font-semibold text-lg">Apple Pay</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'apple_pay' ? 'border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {paymentMethod === 'apple_pay' && <div className="w-3 h-3 rounded-full bg-zinc-900 dark:bg-white" />}
              </div>
            </div>
          </div>

          {/* Card Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'card' ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('card'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'card' ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <CreditCard size={22} />
                </div>
                <span className="font-semibold text-lg">Credit / Debit Card</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-pink-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-pink-500" />}
              </div>
            </div>
            
            {paymentMethod === 'card' && (
              <div className="px-5 pb-6 pt-2 animate-in slide-in-from-top-4 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Card Number</label>
                    <Input 
                      placeholder="0000 0000 0000 0000" 
                      value={cardNumber}
                      onChange={(e) => handleFieldChange('cardNumber', formatCardNumber(e.target.value), setCardNumber)}
                      maxLength={19}
                      className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cardNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                    />
                    {fieldErrors.cardNumber && <p className="text-red-500 text-sm mt-1">{fieldErrors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Expiry Date</label>
                      <Input 
                        placeholder="MM/YY" 
                        value={expiry}
                        onChange={(e) => handleFieldChange('expiry', formatExpiry(e.target.value), setExpiry)}
                        maxLength={5}
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.expiry ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                      />
                      {fieldErrors.expiry && <p className="text-red-500 text-sm mt-1">{fieldErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">CVV</label>
                      <Input 
                        type="password"
                        placeholder="123" 
                        value={cvv}
                        onChange={(e) => handleFieldChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4), setCvv)}
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cvv ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                      />
                      {fieldErrors.cvv && <p className="text-red-500 text-sm mt-1">{fieldErrors.cvv}</p>}
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-5 cursor-pointer bg-white/50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 bg-white"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Save card details securely for future</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* UPI Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'upi' ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('upi'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'upi' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <Smartphone size={22} />
                </div>
                <span className="font-semibold text-lg">UPI Payment</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'upi' ? 'border-pink-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {paymentMethod === 'upi' && <div className="w-3 h-3 rounded-full bg-pink-500" />}
              </div>
            </div>
            
            {paymentMethod === 'upi' && (
              <div className="px-5 pb-6 pt-2 animate-in slide-in-from-top-4 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="max-w-sm">
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">UPI ID</label>
                  <Input 
                    placeholder="username@bank" 
                    value={upiId}
                    onChange={(e) => handleFieldChange('upiId', e.target.value.toLowerCase(), setUpiId)}
                    className={`h-12 text-lg bg-white dark:bg-zinc-900 ${fieldErrors.upiId ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                  />
                  {fieldErrors.upiId && <p className="text-red-500 text-sm mt-1">{fieldErrors.upiId}</p>}
                  <label className="flex items-center gap-3 mt-4 cursor-pointer bg-white/50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 bg-white"
                      checked={saveUpi}
                      onChange={(e) => setSaveUpi(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Save this UPI ID for faster checkouts</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full h-14 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 transition-opacity shadow-[0_8px_20px_0_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:shadow-none"
          onClick={handlePayment}
          disabled={processing || !paymentMethod}
        >
          {processing ? 'Processing Securely...' : `Pay Rs ${pkg.price}`}
        </Button>
        
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
            <ShieldCheck size={16} className="text-green-600 dark:text-green-500" /> Secure 256-bit encryption
          </p>
          <p className="text-xs text-zinc-400 text-center max-w-sm leading-relaxed">
            By proceeding to pay, you accept our Terms of Service and Privacy Policy. Payments are processed securely.
          </p>
        </div>
      </Container>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" /><p>Loading payment details...</p></div>}>
      <PaymentContent />
    </Suspense>
  );
}
