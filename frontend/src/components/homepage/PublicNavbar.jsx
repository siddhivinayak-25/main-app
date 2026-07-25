import { Link } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import BrandLogo from '../brand/BrandLogo';

export default function PublicNavbar() {
  const navItems = ['Product', 'Solutions', 'Resources', 'Pricing'];

  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-border/60 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <BrandLogo to="/" size="md" variant="dark" />

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
            {navItems.map((item) => (
              <button
                key={item}
                className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink transition-colors group bg-transparent border-none p-0 cursor-pointer"
                onClick={() => { /* placeholder: open nav section */ }}
              >
                {item}
                {item !== 'Pricing' && (
                  <ChevronDown size={14} className="text-muted/60 group-hover:text-ink transition-transform group-hover:translate-y-0.5" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Search & Auth Actions */}
        <div className="flex items-center gap-5">
          <button
            aria-label="Search"
            className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-surface-hover transition-colors"
          >
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
