import type { Metadata } from 'next';
import { LoginContent } from '@/components/login-content';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Saathika account to access your matches, chat, verified profile features, and personalized dating dashboard.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In — Saathika Dating App',
    description:
      'Sign in to your Saathika account to access your matches and messages.',
    url: 'https://saathika.app/login',
  },
};

export default function LoginPage() {
  return <LoginContent />;
}
