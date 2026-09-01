import type { Metadata } from 'next';
import { RegisterContent } from '@/components/register-content';

export const metadata: Metadata = {
  title: 'Create Account — Register Free Today',
  description:
    'Join Saathika today for free. Create your verified profile, connect with genuine singles near you, and find your perfect match.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Create Account — Saathika Premium Dating App',
    description:
      'Join Saathika today for free. Create your verified profile and start matching.',
    url: 'https://saathika.app/register',
  },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
