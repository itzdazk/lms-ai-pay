import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface RoleRouteProps {
    children: React.ReactNode
    allowedRoles: ('STUDENT' | 'INSTRUCTOR' | 'ADMIN')[]
    redirectTo?: string
}

export function RoleRoute({
    children,
    allowedRoles,
    redirectTo,
}: RoleRouteProps) {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to='/login' replace />
    }

    if (
        !allowedRoles.includes(user.role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN')
    ) {
        // Redirect to forbidden page by default when user doesn't have required role
        return <Navigate to={redirectTo || '/forbidden'} replace />
    }

    return <>{children}</>
}
