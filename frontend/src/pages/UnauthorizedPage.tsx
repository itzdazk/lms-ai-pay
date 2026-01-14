import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ShieldAlert, LogIn, Home } from 'lucide-react'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function UnauthorizedPage() {
    const navigate = useNavigate()
    const { logout, isAuthenticated } = useAuth()

    // Clear auth state when landing on this page
    useEffect(() => {
        if (isAuthenticated) {
            // Clear localStorage
            localStorage.removeItem('user')
            // Logout from auth context (this will clear cookies via API)
            logout()
        }
    }, [isAuthenticated, logout])

    const handleLogin = () => {
        navigate('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md mx-auto">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <ShieldAlert className="w-16 h-16 text-yellow-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <span className="text-xl font-bold text-yellow-600">401</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Phiên đăng nhập đã hết hạn
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-8 text-base md:text-lg">
                    Phiên làm việc của bạn đã hết hạn hoặc bạn chưa đăng nhập.
                    Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/">
                            <Home className="w-4 h-4" />
                            Về trang chủ
                        </Link>
                    </Button>
                    <Button onClick={handleLogin} className="gap-2">
                        <LogIn className="w-4 h-4" />
                        Đăng nhập lại
                    </Button>
                </div>

                {/* Additional info */}
                <div className="mt-8 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        <strong>Lưu ý:</strong> Vì lý do bảo mật, phiên đăng nhập sẽ tự động hết hạn
                        sau một khoảng thời gian không hoạt động.
                    </p>
                </div>
            </div>
        </div>
    )
}

