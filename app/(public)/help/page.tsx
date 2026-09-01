import type { Metadata } from 'next';
import { HelpContent } from '@/components/help-content';

export const metadata: Metadata = {
  title: 'Help Center — Frequently Asked Questions',
  description:
    'Find answers to common questions about Saathika account setup, verification, matching, coins, security, and safety guidelines.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Help Center — Saathika Support & FAQs',
    description:
      'Find answers to common questions about Saathika account setup, verification, matching, coins, and safety.',
    url: 'https://saathika.app/help',
  },
};

export default function HelpPage() {
  return <HelpContent />;
}
