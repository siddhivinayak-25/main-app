import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [inFlight, setInFlight] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setInFlight(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to create account. Please try again.');
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
          <h2 className="text-xl font-display font-semibold text-ink">Create an account</h2>
          <p className="text-sm text-muted mt-1">Get started with HireOS technical assessments</p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Social Buttons */}
        <div className="mb-6">
          <SocialAuthButtons onError={setApiError} />
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
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Parker"
              disabled={inFlight}
              className={`w-full bg-surface border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 transition-all ${
                errors.name 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-surface-border focus:border-brand-violet focus:ring-brand-violet'
              }`}
            />
            {errors.name && (
              <span className="text-red-600 text-xs mt-1 block">{errors.name}</span>
            )}
          </div>

          {/* Email Field */}
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
              className={`w-full bg-surface border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 transition-all ${
                errors.email 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-surface-border focus:border-brand-violet focus:ring-brand-violet'
              }`}
            />
            {errors.email && (
              <span className="text-red-600 text-xs mt-1 block">{errors.email}</span>
            )}
          </div>

          {/* Password Field */}
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
                className={`w-full bg-surface border rounded-lg pl-3.5 pr-10 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 transition-all ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-surface-border focus:border-brand-violet focus:ring-brand-violet'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-600 text-xs mt-1 block">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={inFlight}
                className={`w-full bg-surface border rounded-lg pl-3.5 pr-10 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 transition-all ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-surface-border focus:border-brand-violet focus:ring-brand-violet'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-600 text-xs mt-1 block">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={inFlight}
            className="w-full bg-brand-violet hover:bg-brand-violet-dark disabled:bg-brand-violet/60 text-white text-sm font-semibold py-2.5 rounded-lg transition-all shadow-sm hover:shadow-glow focus:outline-none cursor-pointer"
          >
            {inFlight ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-violet font-semibold hover:text-brand-violet-dark transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
