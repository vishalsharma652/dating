'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { authApi } from '@/lib/api';
import { Brand } from '@/components/brand';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genderOptions = [
  { label: 'Boy', value: 'male' },
  { label: 'Girl', value: 'female' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = 'Enter your full name to continue.';

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Mobile number is required.';
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      nextErrors.phone = 'Enter a valid mobile number.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!formData.gender) nextErrors.gender = 'Choose your gender.';

    if (!formData.password) {
      nextErrors.password = 'Create a secure password.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password should be at least 8 characters.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.acceptTerms) nextErrors.acceptTerms = 'You must accept the terms and privacy policy.';

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setSubmitError('');

    try {
      const data = await authApi.register({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        password: formData.password,
      });
      localStorage.setItem('onboardPhone', data.phone);
      localStorage.setItem('onboardName', formData.name);
      localStorage.setItem('backendOtp', data.otp);
      router.push('/verify-otp');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_30%)] p-4">
      <Card className="w-full max-w-lg">
        <div className="p-8">
          <div className="mb-8 text-center">
            <Brand className="justify-center mb-4" imageClassName="h-14 w-14" />
            <div className="inline-flex rounded-full bg-pink-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-pink-600 mb-4">
              Premium onboarding
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create your Saathika account</h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Secure your profile with mobile verification and complete onboarding in a few steps.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Full Name
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-4 top-3 text-zinc-400" size={20} />
                  <Input
                    placeholder="Aarav Patel"
                    className="pl-12"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </div>
              </label>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Mobile Number
                <div className="relative mt-2">
                  <Phone className="pointer-events-none absolute left-4 top-3 text-zinc-400" size={20} />
                  <Input
                    placeholder="9876543210"
                    className="pl-12"
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </label>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Email
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-4 top-3 text-zinc-400" size={20} />
                  <Input
                    placeholder="you@example.com"
                    className="pl-12"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
              </label>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Gender
                <select
                  value={formData.gender}
                  onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((gender) => (
                    <option key={gender.value} value={gender.value}>{gender.label}</option>
                  ))}
                </select>
              </label>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Password
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-3 text-zinc-400" size={20} />
                  <Input
                    placeholder="Create password"
                    className="pl-12 pr-12"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-zinc-400 transition hover:text-zinc-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </label>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Confirm Password
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-3 text-zinc-400" size={20} />
                  <Input
                    placeholder="Repeat password"
                    className="pl-12"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                  />
                </div>
              </label>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <label className="flex gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(event) => setFormData({ ...formData, acceptTerms: event.target.checked })}
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-pink-500 focus:ring-pink-500"
              />
              <span>
                I agree to Saathika&apos;s{' '}
                <Link href="/legal/terms" className="font-semibold text-pink-500 hover:text-pink-600">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="font-semibold text-pink-500 hover:text-pink-600">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms}</p>}
            {submitError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{submitError}</p>}

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 rounded-3xl bg-zinc-100/80 p-4 text-sm text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-white">What happens next?</p>
            <p className="mt-1">We will verify your mobile number, confirm your age, and guide you through secure KYC and profile setup.</p>
          </div>

          <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-pink-500 hover:text-pink-600">
              Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
