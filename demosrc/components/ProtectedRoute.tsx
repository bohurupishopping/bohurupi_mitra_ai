import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if authenticated and trying to access login page
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 