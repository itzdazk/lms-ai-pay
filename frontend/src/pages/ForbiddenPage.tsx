import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ShieldX, LayoutDashboard, ArrowLeft, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const roleLabels: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    INSTRUCTOR: 'Giảng viên',
    STUDENT: 'Học viên',
    GUEST: 'Khách',
}

export function ForbiddenPage() {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/dashboard')
        }
    }

    const getDashboardPath = () => {
        if (!user) return '/dashboard'
        switch (user.role) {
            case 'ADMIN':
                return '/admin/dashboard'
            case 'INSTRUCTOR':
                return '/instructor/dashboard'
            default:
                return '/dashboard'
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md mx-auto">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center">
                            <ShieldX className="w-16 h-16 text-destructive" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                            <span className="text-xl font-bold text-destructive">403</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Bạn không có quyền truy cập
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-6 text-base md:text-lg">
                    Xin lỗi, bạn không có quyền truy cập vào trang này.
                    Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một lỗi.
                </p>

                {/* Current Role Info */}
                {isAuthenticated && user && (
                    <div className="mb-8 p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>
                                Vai trò hiện tại của bạn:{' '}
                                <strong className="text-foreground">
                                    {roleLabels[user.role] || user.role}
                                </strong>
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Button>
                    <Button asChild className="gap-2">
                        <Link to={getDashboardPath()}>
                            <LayoutDashboard className="w-4 h-4" />
                            Về Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Additional help */}
                <p className="mt-8 text-sm text-muted-foreground">
                    Cần hỗ trợ?{' '}
                    <Link
                        to="/about"
                        className="text-primary hover:underline"
                    >
                        Liên hệ với chúng tôi
                    </Link>
                </p>
            </div>
        </div>
    )
}

