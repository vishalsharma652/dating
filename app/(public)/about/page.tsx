import { PublicNav } from '@/components/public-nav';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About Saathika</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Reimagining how people connect and find meaningful relationships
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                  To create a premium dating platform where people can form genuine, meaningful connections based on shared values, interests, and authentic compatibility.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We believe everyone deserves to find someone special who truly understands and appreciates them.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                  To become the most trusted and innovative dating platform in South Asia, known for quality matches and real relationships.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  We're committed to safety, verification, and creating an environment where genuine connections flourish.
                </p>
              </div>
            </Card>
          </div>

          <Card className="mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Why Choose Saathika?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Verified & Safe - All profiles are verified and authentic',
                  'Smart Matching - Advanced algorithm for better compatibility',
                  'Premium Features - Coins system for enhanced visibility',
                  'Privacy First - Your data is secure and never shared',
                  '24/7 Support - Round-the-clock customer support',
                  'Mobile First - Seamless experience on all devices',
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle className="text-pink-500 flex-shrink-0" size={24} />
                    <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
