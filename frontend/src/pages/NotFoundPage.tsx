import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
    const navigate = useNavigate()

    const handleGoBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md mx-auto">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                            <FileQuestion className="w-16 h-16 text-muted-foreground" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                            <span className="text-2xl font-bold text-destructive">404</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Trang không tồn tại
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-8 text-base md:text-lg">
                    Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
                </p>

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
                        <Link to="/">
                            <Home className="w-4 h-4" />
                            Về trang chủ
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

