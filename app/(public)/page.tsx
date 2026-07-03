import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { CheckCircle, Zap, Shield, Heart, Users, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10" />
          <Container>
            <div className="text-center relative z-10 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Find Your Perfect Connection
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
                Meet genuine people who share your interests, values, and dreams. Ember brings together authentic profiles for real relationships.
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
                <Button size="lg" asChild>
                  <Link href="/register">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                <div>
                  <p className="text-3xl font-bold text-pink-500">94%</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Verified Profiles</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-500">3.2x</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Better Matches</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pink-500">24k+</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Conversations Started</p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
          <Container>
            <h2 className="text-4xl font-bold text-center mb-12">Why Choose Ember?</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: Shield,
                  title: 'Verified & Safe',
                  description: 'Every profile is verified through multiple security checks',
                },
                {
                  icon: Heart,
                  title: 'Smart Matching',
                  description: 'AI-powered algorithm finds your perfect match',
                },
                {
                  icon: Users,
                  title: 'Genuine People',
                  description: 'Real profiles, real connections, real relationships',
                },
                {
                  icon: Zap,
                  title: 'Premium Features',
                  description: 'Boost your profile and stand out from the crowd',
                },
                {
                  icon: Sparkles,
                  title: 'Smooth Experience',
                  description: 'Beautiful design and intuitive interface',
                },
                {
                  icon: CheckCircle,
                  title: 'Privacy First',
                  description: 'Your data is secure and never shared',
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                      <Icon className="text-pink-500" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <Container>
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-80" />
              <div className="relative p-12 text-center text-white">
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Find Your Perfect Match?
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  Join thousands of people who have found meaningful connections on Ember
                </p>
                <Button size="lg" className="bg-white text-pink-600 hover:bg-white/90" asChild>
                  <Link href="/register">Start For Free Today</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
    </>
  );
}
