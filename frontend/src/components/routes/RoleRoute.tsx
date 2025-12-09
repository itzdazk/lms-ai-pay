import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: ('STUDENT' | 'INSTRUCTOR' | 'ADMIN')[];
  redirectTo?: string;
}

export function RoleRoute({ children, allowedRoles, redirectTo }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN')) {
    // Don't show toast here - API client interceptor will show toast if API call fails with 403
    // If no API call is made, the redirect is sufficient
    return <Navigate to={redirectTo || '/dashboard'} replace />;
  }

  return <>{children}</>;
}

