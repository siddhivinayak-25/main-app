import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Workflow, 
  BarChart3, 
  Users, 
  Sparkles, 
  Share2,
  ArrowRight 
} from 'lucide-react';

export default function FeatureShowcase() {
  const features = [
    {
      icon: ClipboardList,
      title: 'Active Tests',
      desc: 'Build, configure, and monitor automated technical evaluations with sandboxed environments.'
    },
    {
      icon: Workflow,
      title: 'Candidate Pipeline',
      desc: 'Track candidate progress seamlessly in an interactive, visual kanban-style pipeline.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      desc: 'Gain insight into team and individual performance, completion rates, and scoring distributions.'
    },
    {
      icon: Users,
      title: 'Candidates Hub',
      desc: 'Deep-dive assessments including code playbacks, detailed report cards, and logs.'
    },
    {
      icon: Sparkles,
      title: 'Agentic Evaluation',
      desc: 'Run specialized LLM-based agents to grade logic execution, code elegance, and recoverability.'
    },
    {
      icon: Share2,
      title: 'Publish & Share',
      desc: 'Generate public links and instant challenge invites to onboard applicants.'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="bg-surface-card border border-surface-border rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column (Promo Card, 40% / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-brand-violet-dark to-[#0f071d] rounded-2xl p-8 text-white relative overflow-hidden shadow-glow">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Glowing Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-violet-200 mb-6">
                <Sparkles size={12} className="text-brand-violet-light animate-pulse" />
                Featured Launch
              </div>

              {/* Title & Body */}
              <h3 className="text-2xl sm:text-3xl font-display font-semibold mb-4 leading-snug">
                Introducing Agentic Scoring Engine
              </h3>
              <p className="text-violet-200/80 text-sm sm:text-base font-sans leading-relaxed mb-8">
                Move past basic regular expressions. Our engine spawns real evaluator agents that interact with candidates' live endpoints to test resilience, security, and true code execution quality.
              </p>
            </div>

            {/* CTA Outlined Button */}
            <div>
              <Link 
                to="/signup"
                className="inline-flex items-center gap-2 border border-violet-300/40 hover:border-white text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all"
              >
                Explore Scoring
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column (Feature Grid, 60% / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6">
              <span className="text-xs font-bold text-brand-violet tracking-wider uppercase">
                FEATURED
              </span>
              <Link 
                to="/signup" 
                className="text-xs font-semibold text-muted hover:text-ink flex items-center gap-1 transition-colors"
              >
                Explore All Features
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* 2x3 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex gap-4 group">
                    <div className="w-10 h-10 shrink-0 bg-brand-violet-light text-brand-violet rounded-lg flex items-center justify-center transition-colors group-hover:bg-brand-violet group-hover:text-white">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-ink mb-1 group-hover:text-brand-violet transition-colors">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
