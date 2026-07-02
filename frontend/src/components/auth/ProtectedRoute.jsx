import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-violet/20 border-t-brand-violet rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-muted animate-pulse">Loading HireOS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
