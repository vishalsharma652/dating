'use client';

import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        {
          q: 'How do I create an account?',
          a: 'Visit the Register page, fill in your details, and verify your phone number. You can then set up your profile with photos and bio.',
        },
        {
          q: 'How do I verify my profile?',
          a: 'Complete your KYC verification by uploading government-issued ID, and verify your age and mobile number.',
        },
      ],
    },
    {
      category: 'Account & Security',
      items: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.',
        },
        {
          q: 'Is my data safe?',
          a: 'Yes, we use industry-standard encryption to protect your personal data. Check our Privacy Policy for more details.',
        },
      ],
    },
    {
      category: 'Coins & Payments',
      items: [
        {
          q: 'What are coins used for?',
          a: 'Coins help boost your profile visibility, send super likes, and unlock premium features.',
        },
        {
          q: 'Can I get a refund on coins?',
          a: 'All coin purchases are non-refundable, but coins never expire.',
        },
      ],
    },
    {
      category: 'Matching & Chat',
      items: [
        {
          q: 'How does matching work?',
          a: 'We use an advanced algorithm considering your interests, location, and preferences to suggest compatible profiles.',
        },
        {
          q: 'How do I unmatch someone?',
          a: 'Open the chat, tap the menu, and select "Unmatch". This action cannot be undone.',
        },
      ],
    },
    {
      category: 'Safety & Community',
      items: [
        {
          q: 'How do I report a user?',
          a: 'Go to their profile, tap "More", and select "Report". Our team will review the report.',
        },
        {
          q: 'What happens if I receive inappropriate messages?',
          a: 'Block the user immediately and report the conversation to our support team. We take such matters seriously.',
        },
      ],
    },
    {
      category: 'Account Deletion',
      items: [
        {
          q: 'How do I delete my account?',
          a: 'Go to Settings > Account > Delete Account. Your profile and data will be permanently removed.',
        },
        {
          q: 'Can I reactivate my deleted account?',
          a: 'No, account deletion is permanent. You can create a new account anytime.',
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  return (
    <div className="p-4 md:p-8">
      <Container>
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Find answers to common questions
        </p>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-3 text-zinc-400" size={20} />
          <Input
            placeholder="Search help articles..."
            className="pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Contact Support */}
        <Card className="mb-8">
          <div className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Didn't find your answer?</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Contact our support team for personalized help
            </p>
            <Button asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </div>
        </Card>

        {/* FAQs */}
        <div className="space-y-8">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.items.map((item, index) => (
                    <Card key={index} className="p-6">
                      <details className="group">
                        <summary className="flex cursor-pointer items-center justify-between font-semibold">
                          {item.q}
                          <span className="transition group-open:rotate-180">▼</span>
                        </summary>
                        <p className="mt-4 text-zinc-700 dark:text-zinc-300">
                          {item.a}
                        </p>
                      </details>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card>
              <div className="p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No results found for "{searchQuery}"
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Bottom CTA */}
        <Card className="mt-12">
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Our support team is available 24/7 to assist you
            </p>
            <Button asChild>
              <a href="/contact">Get in Touch</a>
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  );
}
