'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { ArrowLeft, CreditCard, Smartphone, Check, ShieldCheck, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { userApi } from '@/lib/api';

// Custom components for UPI Provider logos
const GooglePayLogo = () => (
  <span className="font-bold tracking-tight text-zinc-900 dark:text-white">G<span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#4285F4]">y</span></span>
);
const PhonePeLogo = () => (
  <span className="font-black text-[#5f259f]">Phone<span className="text-pink-500">Pe</span></span>
);
const PaytmLogo = () => (
  <span className="font-extrabold text-[#00b9f5] italic">Paytm</span>
);
const BhimLogo = () => (
  <span className="font-bold text-[#E26827]">BH<span className="text-[#097939]">IM</span></span>
);

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('packageId');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment methods: upi, debit_card, credit_card
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'debit_card' | 'credit_card' | ''>('');
  
  // Form values
  const [upiId, setUpiId] = useState('');
  const [upiProvider, setUpiProvider] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | ''>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Simulation outcome for testing (success, failure, cancel)
  const [simulationOutcome, setSimulationOutcome] = useState<'success' | 'failure' | 'cancel'>('success');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failure' | 'cancelled'>('idle');
  const [coinsAdded, setCoinsAdded] = useState(0);
  const [reference, setReference] = useState('');

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

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!paymentMethod) return { general: 'Please select a payment method' };
    
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        errors.upiId = 'Please enter a valid UPI ID (e.g., username@bank)';
      }
    } else if (paymentMethod === 'debit_card' || paymentMethod === 'credit_card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        errors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
        errors.expiry = 'Please enter a valid expiry (MM/YY)';
      }
      if (cvv.length < 3) {
        errors.cvv = 'Please enter a valid CVV';
      }
      if (!cardName.trim()) {
        errors.cardName = 'Please enter cardholder name';
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

    // Simulate payment gateway loading
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (simulationOutcome === 'cancel') {
      setPaymentStatus('cancelled');
      return;
    }

    if (simulationOutcome === 'failure') {
      setPaymentStatus('failure');
      setError('Payment declined by card issuer / bank. Please try another method.');
      return;
    }

    // Success outcome
    try {
      const gateway = paymentMethod === 'upi' ? 'phonepe' : 'razorpay';
      const mockRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Send all details to the server for validation
      const data = await userApi.purchaseCoins(packageId!, {
        gateway,
        paymentReference: mockRef,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        cardNumber: paymentMethod !== 'upi' ? cardNumber : undefined,
        expiry: paymentMethod !== 'upi' ? expiry : undefined,
        cvv: paymentMethod !== 'upi' ? cvv : undefined,
        cardName: paymentMethod !== 'upi' ? cardName : undefined
      });

      if ((simulationOutcome as string) === 'cancel') {
        setPaymentStatus('cancelled');
        return;
      }

      if ((simulationOutcome as string) === 'failure') {
        setPaymentStatus('failure');
        setError('Payment declined by card issuer / bank. Please try another method.');
        return;
      }

      setReference(mockRef);
      setCoinsAdded(data.coinsAdded);
      setPaymentStatus('success');

      // Auto redirect to wallet
      setTimeout(() => {
        router.push('/user/wallet');
      }, 3000);
    } catch (err: any) {
      setPaymentStatus('idle');
      if (err.errors) {
        setFieldErrors(err.errors);
        setError('Validation failed. Please check the fields below.');
      } else {
        setError(err.message || 'Transaction failed');
      }
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

  if (loading) return <Loader fullscreen text="Loading payment package details..." />;

  if (error && !pkg) return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <p className="text-red-500 mb-6 font-medium">{error}</p>
      <Button onClick={() => router.push('/user/wallet/coins')}>Go Back to Packages</Button>
    </div>
  );

  // Successful checkout screen
  if (paymentStatus === 'success') return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden bg-white dark:bg-zinc-900">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
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
          <p className="text-xs text-zinc-400 font-mono">Reference: {reference}</p>
          <p className="text-sm text-zinc-500 font-medium animate-pulse mt-2">Redirecting to your wallet...</p>
        </div>
      </Card>
    </div>
  );

  // Cancelled payment screen
  if (paymentStatus === 'cancelled') return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden bg-white dark:bg-zinc-900">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.2)]">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
          <p className="text-zinc-500 text-sm">
            The transaction was aborted. No coins were purchased, and your account has not been charged.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => setPaymentStatus('idle')}>Try Again</Button>
          <Button variant="ghost" onClick={() => router.push('/user/wallet')}>Go to Wallet</Button>
        </div>
      </Card>
    </div>
  );

  // Failed payment screen (if we don't display failure inside payment form)
  if (paymentStatus === 'failure' && !paymentMethod) return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden bg-white dark:bg-zinc-900">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Payment Failed</h2>
          <p className="text-zinc-500 text-sm">
            {error || 'An unexpected error occurred during processing.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => { setPaymentStatus('idle'); setError(''); }}>Try Again</Button>
          <Button variant="ghost" onClick={() => router.push('/user/wallet/coins')}>Cancel</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <Loader loading={paymentStatus === 'processing'} fullscreen text="Processing secure payment gateway transaction..." />
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

        {/* Order Summary */}
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

        {/* Testing Panel */}
        <Card className="mb-8 p-4 border border-[#7C3AED]/20 bg-[#7C3AED]/5 dark:bg-[#7C3AED]/10 rounded-2xl space-y-3">
          <div className="flex gap-2 items-center text-xs font-semibold text-[#7C3AED] dark:text-[#a78bfa]">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
            <span>Developer Sandbox / Simulation Panel</span>
          </div>
          <p className="text-xs text-zinc-500">
            Simulate how the payment flow behaves upon clicking pay. Set the outcome to test success, failures, and cancellations.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setSimulationOutcome('success')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${simulationOutcome === 'success' ? 'bg-green-500 text-white border-green-600 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'}`}
            >
              Simulate Success
            </button>
            <button 
              onClick={() => setSimulationOutcome('failure')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${simulationOutcome === 'failure' ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'}`}
            >
              Simulate Failure
            </button>
            <button 
              onClick={() => setSimulationOutcome('cancel')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${simulationOutcome === 'cancel' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'}`}
            >
              Simulate Cancel
            </button>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
          
          {/* UPI Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'upi' ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('upi'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'upi' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
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
                <div className="space-y-4 max-w-sm">
                  {/* Provider selection buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Select App</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'gpay', render: <GooglePayLogo /> },
                        { id: 'phonepe', render: <PhonePeLogo /> },
                        { id: 'paytm', render: <PaytmLogo /> },
                        { id: 'bhim', render: <BhimLogo /> }
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => {
                            setUpiProvider(prov.id as any);
                            // Prefill UPI ID structure based on selection
                            if (prov.id === 'gpay') setUpiId('username@okaxis');
                            else if (prov.id === 'phonepe') setUpiId('username@ybl');
                            else if (prov.id === 'paytm') setUpiId('username@paytm');
                            else if (prov.id === 'bhim') setUpiId('username@upi');
                          }}
                          className={`h-10 rounded-lg border text-sm flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-all ${upiProvider === prov.id ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-zinc-200 dark:border-zinc-800'}`}
                        >
                          {prov.render}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">UPI ID</label>
                    <Input 
                      placeholder="username@bank" 
                      value={upiId}
                      onChange={(e) => handleFieldChange('upiId', e.target.value.toLowerCase(), setUpiId)}
                      className={`h-12 text-lg bg-white dark:bg-zinc-900 ${fieldErrors.upiId ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' : ''}`}
                    />
                    {fieldErrors.upiId && <p className="text-red-500 text-sm mt-1">{fieldErrors.upiId}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Debit Card Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'debit_card' ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('debit_card'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'debit_card' ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <CreditCard size={22} />
                </div>
                <span className="font-semibold text-lg">Debit Card</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'debit_card' ? 'border-pink-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {paymentMethod === 'debit_card' && <div className="w-3 h-3 rounded-full bg-pink-500" />}
              </div>
            </div>
            
            {paymentMethod === 'debit_card' && (
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
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.expiry ? 'border-red-500 focus:border-red-500' : ''}`}
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
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cvv ? 'border-red-500' : ''}`}
                      />
                      {fieldErrors.cvv && <p className="text-red-500 text-sm mt-1">{fieldErrors.cvv}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Cardholder Name</label>
                    <Input 
                      placeholder="Name as printed on Card" 
                      value={cardName}
                      onChange={(e) => handleFieldChange('cardName', e.target.value, setCardName)}
                      className={`bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cardName ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.cardName && <p className="text-red-500 text-sm mt-1">{fieldErrors.cardName}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Credit Card Option */}
          <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer ${paymentMethod === 'credit_card' ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-zinc-950'}`}
            onClick={() => { setPaymentMethod('credit_card'); setError(''); setFieldErrors({}); }}
          >
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${paymentMethod === 'credit_card' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <CreditCard size={22} />
                </div>
                <span className="font-semibold text-lg">Credit Card</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'credit_card' ? 'border-pink-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {paymentMethod === 'credit_card' && <div className="w-3 h-3 rounded-full bg-pink-500" />}
              </div>
            </div>
            
            {paymentMethod === 'credit_card' && (
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
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.expiry ? 'border-red-500 focus:border-red-500' : ''}`}
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
                        className={`font-mono bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cvv ? 'border-red-500' : ''}`}
                      />
                      {fieldErrors.cvv && <p className="text-red-500 text-sm mt-1">{fieldErrors.cvv}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Cardholder Name</label>
                    <Input 
                      placeholder="Name as printed on Card" 
                      value={cardName}
                      onChange={(e) => handleFieldChange('cardName', e.target.value, setCardName)}
                      className={`bg-white dark:bg-zinc-900 h-12 text-lg ${fieldErrors.cardName ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.cardName && <p className="text-red-500 text-sm mt-1">{fieldErrors.cardName}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full h-14 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 transition-opacity shadow-[0_8px_20px_0_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:shadow-none"
          onClick={handlePayment}
          disabled={paymentStatus === 'processing' || !paymentMethod}
        >
          {paymentStatus === 'processing' ? 'Processing Securely...' : `Pay Rs ${pkg.price}`}
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
