import { Link } from 'react-router-dom';
import { Search, ChevronDown, Sparkles } from 'lucide-react';

export default function PublicNavbar() {
  const navItems = ['Product', 'Solutions', 'Resources', 'Pricing'];

  return (
    <header className="sticky top-0 z-50 bg-surface-raised/90 backdrop-blur-md border-b border-surface-border transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-violet flex items-center justify-center text-white shadow-glow transition-transform group-hover:scale-105">
              <Sparkles size={16} />
            </div>
            <span className="text-xl font-display font-bold text-ink">HireOS</span>
          </Link>

          {/* Center-left: Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <div key={item} className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink cursor-pointer transition-colors group">
                {item}
                {item !== 'Pricing' && (
                  <ChevronDown size={14} className="text-muted/60 group-hover:text-ink transition-transform group-hover:translate-y-0.5" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right: Search & Auth Actions */}
        <div className="flex items-center gap-5">
          <button className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-surface-hover transition-colors">
            <Search size={18} />
          </button>
          
          <Link
            to="/login"
            className="text-sm font-semibold text-brand-violet hover:text-brand-violet-dark transition-colors"
          >
            Sign In
          </Link>

          <Link
            to="/signup"
            className="text-sm font-semibold border border-brand-violet text-brand-violet px-4 py-2 rounded-lg hover:bg-brand-violet hover:text-white transition-all shadow-sm hover:shadow-glow"
          >
            Sign Up
          </Link>
        </div>

      </div>
    </header>
  );
}
