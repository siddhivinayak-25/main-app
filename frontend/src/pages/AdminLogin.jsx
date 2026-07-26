import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import BrandLogo from '../components/brand/BrandLogo';
import TopographicBackground from '../components/visual/TopographicBackground';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [favoritePerson, setFavoritePerson] = useState('');
  const [favoriteNumber, setFavoriteNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [inFlight, setInFlight] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || '/admin/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password || !favoritePerson || !favoriteNumber) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setInFlight(true);
    try {
      await login({ username, password, favoritePerson, favoriteNumber });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Access denied');
    } finally {
      setInFlight(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-surface">
      <TopographicBackground className="z-0" density="dense" />

      <div className="relative z-10 mb-8">
        <BrandLogo to="/" size="lg" variant="dark" />
      </div>

      <div className="relative z-10 w-full max-w-md card-elevated p-8 border-t-4 border-brand-violet">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-brand-violet/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield size={22} className="text-brand-violet" />
          </div>
          <h2 className="text-xl font-display font-semibold text-ink">Supreme Admin Access</h2>
          <p className="text-sm text-muted mt-1">Enter your admin credentials to review the entire platform.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={inFlight}
              className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
  
                disabled={inFlight}
                className="w-full bg-surface border border-surface-border rounded-lg pl-3.5 pr-10 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/10 transition-all"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">Favourite Person</label>
            <input
              type="text"
              value={favoritePerson}
              onChange={(e) => setFavoritePerson(e.target.value)}
              disabled={inFlight}
              className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">Favourite Number</label>
            <input
              type="number"
              value={favoriteNumber}
              onChange={(e) => setFavoriteNumber(e.target.value)}
              disabled={inFlight}
              className="w-full bg-surface border border-surface-border rounded-lg px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/10 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={inFlight}
            className="w-full bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-all shadow-glow hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {inFlight ? 'Verifying...' : 'Enter Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
