import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface py-24 md:py-32">
      {/* Background Radial Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(124, 58, 237, 0.08) 0%, rgba(247, 245, 252, 0) 70%)',
        }}
      />
      {/* Subtle Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#7C3AED 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Upper Micro-Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-violet-light/80 border border-brand-violet/20 px-3 py-1 rounded-full text-xs font-semibold text-brand-violet mb-8 animate-fade-in">
          <span className="flex h-1.5 w-1.5 rounded-full bg-brand-violet animate-pulse" />
          Next-Gen Candidate Assessment
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-ink tracking-tight leading-tight max-w-4xl mb-6">
          Hiring intelligence, built for how <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-violet to-brand-violet-dark bg-clip-text text-transparent">
            agentic teams actually work
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-muted font-sans max-w-2xl leading-relaxed mb-10">
          Evaluate developers, AI specialists, and project managers using advanced simulated agents. Go beyond static multiple-choice questions with real sandbox test environments.
        </p>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="group inline-flex items-center gap-2 bg-brand-violet hover:bg-brand-violet-dark text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-glow hover:scale-[1.02]"
        >
          Get Started Free
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Mini stats or social proof */}
        <div className="mt-16 pt-8 border-t border-surface-border w-full max-w-3xl flex items-center justify-around text-muted text-xs sm:text-sm font-medium">
          <div>Trusted by 500+ Engineering Teams</div>
          <div className="hidden sm:block text-surface-border">|</div>
          <div>50,000+ Agentic Tests Run</div>
          <div className="hidden sm:block text-surface-border">|</div>
          <div>99.4% Matching Accuracy</div>
        </div>
      </div>
    </section>
  );
}
