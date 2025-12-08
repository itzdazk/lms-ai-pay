import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { toast } from 'sonner';

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
    toast.error('Bạn không có quyền truy cập trang này');
    return <Navigate to={redirectTo || '/dashboard'} replace />;
  }

  return <>{children}</>;
}

