import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminProtectedRoute() {
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-violet/20 border-t-brand-violet rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-muted animate-pulse">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
