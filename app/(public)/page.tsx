'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { CheckCircle2, Zap, Shield, Heart, Users, Sparkles } from 'lucide-react';
import { getStoredUser } from '@/lib/api';

// Canvas Particle System for premium float effect
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function Home() {
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined' && getStoredUser()) {
      router.replace('/user/dashboard');
    }
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    },
  };

  const features = [
    {
      icon: Shield,
      title: 'Verified & Safe',
      description: 'Every profile is verified through multiple security checks to ensure authentic interactions.',
      color: '#7C3AED',
    },
    {
      icon: Heart,
      title: 'Smart Matching',
      description: 'Our proprietary AI-powered matchmaking system pairs you with people sharing your core values.',
      color: '#EC4899',
    },
    {
      icon: Users,
      title: 'Genuine People',
      description: 'A close-knit community focused on authentic dates, meaningful conversation, and lasting relationships.',
      color: '#A855F7',
    },
    {
      icon: Zap,
      title: 'Premium Features',
      description: 'Unlock profile boosts, priority chat requests, and advanced search filters for a faster connection.',
      color: '#EC4899',
    },
    {
      icon: Sparkles,
      title: 'Smooth Experience',
      description: 'A luxury user interface optimized for fast navigation, instant messaging, and modern profiles.',
      color: '#7C3AED',
    },
    {
      icon: CheckCircle2,
      title: 'Privacy First',
      description: 'Your private data is fully encrypted, secure, and never shared with third-party networks.',
      color: '#A855F7',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="min-h-[85vh] flex items-center justify-center pt-28 md:pt-36 pb-16 px-4 relative overflow-hidden bg-gradient-to-b from-[#070B18] via-[#0b1024] to-[#070B18]">
        {/* Floating Canvas Particles */}
        <FloatingParticles />

        <Container className="relative z-10 py-12">
          <motion.div 
            className="text-center max-w-4xl mx-auto space-y-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Glassmorphism Badge */}
            <motion.div variants={itemVariants} className="inline-flex">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 text-xs font-semibold tracking-wider uppercase select-none shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:border-[#EC4899]/30 hover:bg-white/[0.05] transition-all duration-500 group cursor-default">
                <Heart className="fill-[#EC4899] text-[#EC4899] animate-pulse" size={14} />
                <span className="bg-gradient-to-r from-zinc-200 to-white bg-clip-text text-transparent">Trusted by Thousands</span>
              </div>
            </motion.div>

            {/* Heading (72px styled text) */}
            <motion.h1 
              variants={itemVariants} 
              className="text-5xl md:text-[76px] font-black tracking-tight text-white leading-[1.05] md:leading-[1.1]"
            >
              Find Your Perfect <br />
              <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#7C3AED] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(236,72,153,0.3)]">
                Connection
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              variants={itemVariants} 
              className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Meet genuine people who share your interests, values, and dreams. Saathika brings together authentic profiles for real relationships.
            </motion.p>

            {/* Premium CTA Buttons */}
            <motion.div 
              variants={itemVariants} 
              className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-2"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#7C3AED] hover:opacity-95 text-white font-bold rounded-full border-0 px-10 py-7 text-base shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.55)] hover:-translate-y-1.5 transition-all duration-300 group"
                asChild
              >
                <Link href="/register" className="flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/8 text-white font-bold rounded-full px-10 py-7 text-base hover:-translate-y-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>

            {/* Statistics Glassmorphism Card */}
            <motion.div 
              variants={itemVariants} 
              className="pt-16 max-w-4xl mx-auto"
            >
              <div className="bg-[#101827]/45 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                {/* Soft glowing hover border */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#EC4899]/8 via-transparent to-[#7C3AED]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-white/5 relative z-10">
                  
                  {/* Stat 1 */}
                  <div className="flex items-center gap-5 justify-center md:justify-start px-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#EC4899]/10 border border-[#EC4899]/20 flex items-center justify-center text-[#EC4899] flex-shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.15)] group-hover:scale-105 transition-transform duration-300">
                      <Shield size={24} className="drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-black text-white tracking-tight leading-none">94%</p>
                      <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider mt-2.5">Verified Profiles</p>
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="flex items-center gap-5 justify-center md:justify-start pt-6 md:pt-0 px-4 md:pl-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:scale-105 transition-transform duration-300">
                      <Sparkles size={24} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-black text-white tracking-tight leading-none">3.2x</p>
                      <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider mt-2.5">Better Matches</p>
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="flex items-center gap-5 justify-center md:justify-start pt-6 md:pt-0 px-4 md:pl-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] flex-shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:scale-105 transition-transform duration-300">
                      <Users size={24} className="drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-black text-white tracking-tight leading-none">24K+</p>
                      <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider mt-2.5">Conversations Started</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-4 relative">
        <Container>
          
          {/* Eyebrow & Title */}
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-extrabold text-[#EC4899] tracking-[0.2em] uppercase block">
              WHY CHOOSE SAATHIKA
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight relative inline-block pb-3">
              Why Choose <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#7C3AED] bg-clip-text text-transparent">Saathika?</span>
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-[#EC4899] to-[#7C3AED] rounded-full" />
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="relative group bg-[#111827]/60 backdrop-blur-2xl border border-[#7C3AED]/20 p-10 rounded-[18px] hover:border-[#7C3AED]/40 hover:-translate-y-2.5 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.08)] overflow-hidden"
                >
                  {/* Card ambient glow circle */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7C3AED]/15 transition-colors duration-500" />
                  
                  {/* Neon Icon Container */}
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-300 text-white relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
                    {/* Neon Glow under the icon */}
                    <div 
                      className="absolute inset-0 blur-[12px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      style={{ backgroundColor: `${feature.color}18` }} 
                    />
                    <Icon size={32} style={{ color: feature.color, filter: `drop-shadow(0 0 8px ${feature.color}aa)` }} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-[#94A3B8] leading-relaxed text-sm font-medium">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-4 relative z-10">
        <Container>
          <div className="max-w-5xl mx-auto relative group">
            {/* Soft purple glow around the card */}
            <div className="absolute inset-0 bg-[#7C3AED]/20 blur-[40px] rounded-[24px] pointer-events-none transition-opacity duration-500 group-hover:bg-[#7C3AED]/25" />
            
            {/* The Premium CTA Card */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#7C3AED]/30 via-[#EC4899]/25 to-[#6366F1]/30 backdrop-blur-2xl border border-white/25 shadow-[0_20px_50px_rgba(124,58,237,0.3)] px-8 py-12 md:py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 min-h-[220px] md:min-h-[260px] z-10">
              
              {/* Subtle floating particles in the background */}
              <div className="absolute top-6 left-1/4 w-1.5 h-1.5 bg-white/40 rounded-full blur-[0.5px] animate-pulse pointer-events-none" />
              <div className="absolute bottom-8 left-1/3 w-2.5 h-2.5 bg-white/20 rounded-full blur-[0.5px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
              <div className="absolute top-10 right-1/4 w-1 h-1 bg-white/50 rounded-full blur-[0.5px] animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} />
              <div className="absolute bottom-4 right-1/3 w-2 h-2 bg-white/10 rounded-full blur-[0.5px] animate-pulse pointer-events-none" style={{ animationDelay: '2.2s' }} />
              
              {/* Left Side: Large premium 3D heart illustration with neon glow */}
              <div className="relative w-48 h-48 md:w-[260px] md:h-[260px] flex-shrink-0 flex items-center justify-center select-none pointer-events-none animate-float-slow z-10 md:-my-10">
                {/* Neon pink and purple lighting behind the hearts */}
                <div className="absolute w-36 h-36 bg-[#EC4899]/40 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute w-36 h-36 bg-[#7C3AED]/35 rounded-full blur-2xl pointer-events-none" style={{ transform: 'translateX(30px)' }} />
                
                <img 
                  src="/cta-hearts.png" 
                  alt="3D Hearts Illustration" 
                  className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.35)] relative z-10 scale-[1.3] md:scale-[1.4]"
                />
              </div>

              {/* Right Side: Heading, description, and CTA button stacked vertically */}
              <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-4 relative z-10">
                <h2 className="text-3xl md:text-[44px] font-black text-white tracking-tight leading-tight md:leading-[1.1]">
                  Ready to Find Your Perfect Match?
                </h2>
                <p className="text-zinc-200/95 text-sm md:text-[18px] max-w-[500px] leading-relaxed font-medium">
                  Join thousands of people who have found meaningful connections on Saathika. Create your profile today.
                </p>
                <div className="pt-2">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-[#EC4899] to-[#7C3AED] hover:from-[#FF5DAB] hover:to-[#8B5CF6] text-white font-bold rounded-full border-0 px-8 py-6.5 text-base transition-all duration-300 hover:scale-[1.03] shadow-[0_4px_20px_rgba(236,72,153,0.35)] hover:shadow-[0_0_25px_rgba(236,72,153,0.55)] group"
                    asChild
                  >
                    <Link href="/register" className="flex items-center gap-2.5">
                      <span>Start For Free Today</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

// ArrowRight implementation
function ArrowRight({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
