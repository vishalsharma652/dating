'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import {
  ArrowLeft,
  QrCode,
  Check,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Lock,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Clock,
  Coins,
  CreditCard
} from 'lucide-react';
import { userApi, getStoredUser } from '@/lib/api';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('packageId');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Screenshot upload state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setError('Coin Package not found');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load package'))
      .finally(() => setLoading(false));
  }, [packageId, router]);

  const copyUpiHandle = () => {
    const handle = '9352692626@kotakbank';
    navigator.clipboard.writeText(handle);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Screenshot image size must be under 10MB');
      return;
    }
    setError('');
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile) {
      setError('Please attach your payment screenshot proof before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('packageId', String(packageId));
      formData.append('screenshot', screenshotFile);
      if (transactionRef.trim()) {
        formData.append('transactionRef', transactionRef.trim());
      }

      const res = await userApi.submitPaymentProof(formData);
      setSubmittedRequest(res.request);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment screenshot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader fullscreen text="Loading payment package details..." />;

  if (error && !pkg && !isSubmitted)
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <p className="text-red-500 mb-6 font-medium">{error}</p>
        <Button onClick={() => router.push('/user/wallet/coins')}>Go Back to Packages</Button>
      </div>
    );

  // Submitted & Under Admin Verification Screen
  if (isSubmitted) {
    const totalCoins = Number(pkg?.coins || submittedRequest?.coins || 0) + Number(pkg?.bonus || submittedRequest?.bonus_coins || 0);
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
        <Card className="max-w-lg w-full p-8 text-center space-y-6 border-none shadow-[0_8px_30px_rgb(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500"></div>
          
          <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <Clock className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
              ⏳ Pending Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-3.5 mb-2">
              Payment Screenshot Submitted!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed max-w-sm mx-auto">
              Your payment proof has been successfully sent to the admin. Once verified, <span className="font-bold text-pink-500">{totalCoins} coins</span> will be credited to your wallet balance.
            </p>
          </div>

          {/* Payment Request Summary */}
          <div className="w-full bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-5 text-left border border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Request ID:</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">#REQ-{submittedRequest?.id || 'SUBMITTED'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Package Name:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{pkg?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Amount Paid:</span>
              <span className="font-black text-sm text-pink-500">₹{pkg?.price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Coins to Credit:</span>
              <span className="font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                🪙 {totalCoins} Coins
              </span>
            </div>
            {transactionRef && (
              <div className="flex justify-between items-center pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-zinc-400">Reference / UTR:</span>
                <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{transactionRef}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 font-bold"
              onClick={() => router.push('/user/wallet')}
            >
              Go to My Wallet
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => router.push('/user/wallet/coins')}
            >
              View Packages
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalCoins = Number(pkg?.coins || 0) + Number(pkg?.bonus || 0);

  return (
    <div className="p-4 md:p-8 bg-[#070B18] min-h-screen text-white pb-20">
      <Container className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-zinc-800 text-zinc-300"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Checkout Payment</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Pay via QR Code &amp; Upload Payment Screenshot</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-start gap-3 animate-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold mb-0.5">Payment Notice</p>
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Order Summary Card */}
        <Card className="mb-8 border border-white/10 shadow-xl overflow-hidden bg-white/5 backdrop-blur-md relative rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Selected Coin Package</span>
              </h2>
              <span className="text-xs text-pink-400 font-bold bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> {pkg?.name}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Coins Included</span>
                <span className="font-black text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full text-xs">
                  {pkg?.coins} {Number(pkg?.bonus) > 0 ? `+ ${pkg.bonus} Bonus Coins` : ''} ({totalCoins} Total)
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10 text-lg font-extrabold">
                <span className="text-zinc-200">Total Payable Amount</span>
                <span className="text-2xl font-black text-pink-500">₹{pkg?.price}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* QR Code Section — Direct & Fixed */}
        <Card className="mb-8 border border-white/10 shadow-2xl bg-zinc-900/90 rounded-3xl overflow-hidden p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
              <QrCode size={13} /> Step 1: Scan &amp; Pay
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Kotak 811 UPI QR Code</h2>
            <p className="text-xs text-zinc-400 mt-1">Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI App</p>
          </div>

          <div className="flex flex-col items-center max-w-sm mx-auto">
            {/* Kotak 811 QR Card Container */}
            <div className="w-full rounded-3xl overflow-hidden bg-black border border-white/15 shadow-2xl p-6 text-white relative flex flex-col items-center">
              {/* Kotak 811 Header */}
              <div className="flex flex-col items-center gap-1 mb-4">
                <div className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
                  <span className="text-white">kotak</span>
                  <span className="text-white bg-[#be123c] px-2.5 py-0.5 rounded-lg text-base font-black">811</span>
                </div>
                <p className="text-xs text-zinc-300 font-semibold mt-0.5">UPI Instant Payment</p>
              </div>

              {/* Dynamic QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-2xl mb-4 border border-white/30 relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(`upi://pay?pa=9352692626@kotakbank&pn=SNEHA%20GOYAL&am=${pkg?.price || ''}&cu=INR`)}`}
                  alt="Kotak 811 UPI QR Code"
                  className="w-52 h-52 rounded-xl object-contain"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#be123c] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                  Exact Amount: ₹{pkg?.price}
                </div>
              </div>

              {/* Account Details Box */}
              <div className="w-full rounded-2xl bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#9f1239] p-4 text-left shadow-lg border border-red-400/30 mt-2">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/80">Account Holder</p>
                <h4 className="text-lg font-black text-white tracking-wide mt-0.5">SNEHA GOYAL</h4>
                <div className="mt-2.5 pt-2.5 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/70 font-semibold uppercase">UPI ID</p>
                    <p className="text-xs font-mono font-bold text-white tracking-wider">9352692626@kotakbank</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyUpiHandle}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-[#be123c] font-black text-xs hover:bg-zinc-100 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={12} /> {copiedUpi ? 'Copied!' : 'Copy UPI'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2: Upload Payment Screenshot Proof Form */}
        <Card className="mb-8 border border-white/10 shadow-2xl bg-zinc-900/90 rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
              <Upload size={13} /> Step 2: Upload Proof
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Upload Payment Screenshot</h2>
            <p className="text-xs text-zinc-400 mt-1">Take a screenshot of your successful UPI payment and upload it below</p>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-6">
            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                Payment Screenshot <span className="text-pink-500">*</span>
              </label>

              {!screenshotPreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-white/20 bg-white/5 hover:border-pink-500/60 hover:bg-white/8'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-zinc-400 mt-1">PNG, JPG, JPEG or WEBP (Max: 10MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl border border-pink-500/40 bg-black/40 p-4 flex flex-col items-center">
                  <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-xl bg-zinc-950">
                    <img
                      src={screenshotPreview}
                      alt="Payment proof screenshot preview"
                      className="max-h-72 w-auto object-contain rounded-lg shadow-lg"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between w-full pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-zinc-300 truncate max-w-[200px] sm:max-w-xs">
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate font-semibold">{screenshotFile?.name || 'screenshot.jpg'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition text-zinc-200"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-bold transition text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>



            {/* Submit Proof Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !screenshotFile}
              className="w-full h-14 text-base font-black rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 transition-all shadow-[0_8px_25px_0_rgba(236,72,153,0.35)] disabled:opacity-50 disabled:shadow-none cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Uploading &amp; Submitting Screenshot...
                </span>
              ) : (
                `Submit Screenshot & Verify Payment (₹${pkg?.price})`
              )}
            </Button>
          </form>
        </Card>

        {/* Security & Verification Notice */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold text-zinc-400 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <ShieldCheck size={16} className="text-emerald-400" /> Admin Fast-Track Verification Active
          </p>
          <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
            Your payment is secure. Coins will be credited to your account as soon as the screenshot is verified by the admin team.
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
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p>Loading checkout environment...</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
