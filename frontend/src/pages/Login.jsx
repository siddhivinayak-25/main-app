import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [inFlight, setInFlight] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setInFlight(true);
    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setInFlight(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-lg bg-brand-violet flex items-center justify-center text-white shadow-glow transition-transform group-hover:scale-105">
          <Sparkles size={18} />
        </div>
        <span className="text-2xl font-display font-bold text-ink">HireOS</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-display font-semibold text-ink">Welcome back</h2>
          <p className="text-sm text-muted mt-1">Sign in to manage your hiring evaluations</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Social Buttons */}
        <div className="mb-6">
          <SocialAuthButtons onError={setError} />
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-card px-3 text-muted">or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={inFlight}
              className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={inFlight}
                className="w-full bg-surface border border-surface-border rounded-lg pl-3.5 pr-10 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={inFlight}
            className="w-full bg-brand-violet hover:bg-brand-violet-dark disabled:bg-brand-violet/60 text-white text-sm font-semibold py-2.5 rounded-lg transition-all shadow-sm hover:shadow-glow focus:outline-none cursor-pointer"
          >
            {inFlight ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Links & Demo Credentials */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-xs text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-violet font-semibold hover:text-brand-violet-dark transition-colors">
              Sign Up
            </Link>
          </p>

          <div className="pt-4 border-t border-surface-border">
            <div className="inline-block bg-brand-violet-light/50 border border-brand-violet/10 rounded-lg px-3 py-2 text-[11px] text-brand-violet-dark/80 text-left font-sans">
              <span className="font-semibold">Demo credentials:</span>
              <div className="mt-0.5 font-mono">
                Email: alex@company.com<br />
                Password: password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
