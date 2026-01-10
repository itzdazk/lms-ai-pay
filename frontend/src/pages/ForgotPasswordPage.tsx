import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { BookOpen, ArrowLeft, Mail, Loader2, CheckCircle, Moon, Sun, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../lib/api/auth'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const { isAuthenticated, user } = useAuth()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errors, setErrors] = useState<{ email?: string }>({})

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            // Redirect to previous page or home
            const from = (location.state as any)?.from?.pathname
            if (from) {
                navigate(from, { replace: true })
            } else {
                // Go back in history if possible, otherwise go to home
                if (window.history.length > 1) {
                    navigate(-1)
                } else {
                    navigate('/', { replace: true })
                }
            }
        }
    }, [isAuthenticated, user, navigate, location])

    const validateEmail = () => {
        const newErrors: typeof errors = {}

        if (!email.trim()) {
            newErrors.email = 'Email không được để trống'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateEmail()) {
            // Focus vào field bị lỗi
            if (errors.email) {
                document.getElementById('email')?.focus()
            }
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            await authApi.forgotPassword(email)
            setIsSuccess(true)
            toast.success('Email khôi phục mật khẩu đã được gửi!')
        } catch (error: any) {
            console.error('Forgot password error:', error)

            // Handle specific errors
            if (error.response?.status === 404) {
                setErrors({ email: 'Email không tồn tại trong hệ thống' })
            }
            // Other errors are handled by client.ts interceptor
        } finally {
            setIsLoading(false)
        }
    }

    // Success screen
    if (isSuccess) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-white dark:bg-black py-8 px-4'>
                <div className='w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl p-8 relative'>
                    {/* Theme Toggle Button */}
                    <div className='absolute top-4 right-4'>
                        <DarkOutlineButton
                            size='icon'
                            onClick={toggleTheme}
                            title={
                                theme === 'dark'
                                    ? 'Chuyển sang Light Mode'
                                    : 'Chuyển sang Dark Mode'
                            }
                        >
                            {theme === 'dark' ? (
                                <Moon className='h-5 w-5' />
                            ) : (
                                <Sun className='h-5 w-5' />
                            )}
                        </DarkOutlineButton>
                    </div>
                    {/* Logo */}
                    <Link
                        to='/'
                        className='flex items-center justify-center gap-2 mb-8'
                    >
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-black border border-white/30'>
                            <BookOpen className='h-7 w-7 text-white' />
                        </div>
                        <span className='text-2xl font-semibold text-white'>
                            EduLearn
                        </span>
                    </Link>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader className='space-y-1'>
                            <div className='flex justify-center mb-4'>
                                <CheckCircle className='h-16 w-16 text-green-500' />
                            </div>
                            <CardTitle className='text-2xl text-center text-white'>
                                Email đã được gửi!
                            </CardTitle>
                            <CardDescription className='text-center text-gray-400'>
                                Chúng tôi đã gửi link đặt lại mật khẩu đến{' '}
                                <strong className='text-white'>{email}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4 text-sm text-gray-400'>
                                <p className='mb-2'>
                                    📧 Kiểm tra email của bạn
                                </p>
                                <p className='mb-2'>
                                    ⏰ Link sẽ hết hạn sau 1 giờ
                                </p>
                                <p>
                                    📁 Không thấy email? Kiểm tra thư mục spam
                                </p>
                            </div>

                            <DarkOutlineButton
                                onClick={() => {
                                    setIsSuccess(false)
                                    setEmail('')
                                }}
                                className='w-full'
                            >
                                Gửi lại email
                            </DarkOutlineButton>
                        </CardContent>
                        <CardFooter>
                            <Link
                                to='/login'
                                className='text-sm text-center w-full text-blue-600 hover:underline'
                            >
                                Quay lại đăng nhập
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-white dark:bg-black py-8 px-4'>
            <div className='w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl p-8 relative'>
                {/* Theme Toggle Button */}
                <div className='absolute top-4 right-4'>
                    <DarkOutlineButton
                        size='icon'
                        onClick={toggleTheme}
                        title={
                            theme === 'dark'
                                ? 'Chuyển sang Light Mode'
                                : 'Chuyển sang Dark Mode'
                        }
                    >
                        {theme === 'dark' ? (
                            <Moon className='h-5 w-5' />
                        ) : (
                            <Sun className='h-5 w-5' />
                        )}
                    </DarkOutlineButton>
                </div>
                {/* Logo */}
                <Link
                    to='/'
                    className='flex items-center justify-center gap-2 mb-8'
                >
                    <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-black border border-white/30'>
                        <BookOpen className='h-7 w-7 text-white' />
                    </div>
                    <span className='text-2xl font-semibold text-white'>
                        EduLearn
                    </span>
                </Link>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='text-2xl text-center text-white'>
                            Quên mật khẩu
                        </CardTitle>
                        <CardDescription className='text-center text-gray-400'>
                            Nhập email của bạn để nhận link khôi phục mật khẩu
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className='space-y-4' noValidate>
                            <div className='space-y-2'>
                                <Label htmlFor='email' className='text-white'>
                                    Email
                                </Label>
                                <div className='relative'>
                                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        id='email'
                                        type='email'
                                        placeholder='name@example.com'
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            // Clear error when user starts typing
                                            if (errors.email) {
                                                setErrors({})
                                            }
                                        }}
                                        className={`pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.email ? 'border-red-500' : ''
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <DarkOutlineButton
                                type='submit'
                                className='w-full'
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang gửi...
                                    </>
                                ) : (
                                    'Gửi email khôi phục'
                                )}
                            </DarkOutlineButton>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <div className='text-sm text-center w-full space-y-2'>
                            <Link
                                to='/login'
                                className='flex items-center justify-center gap-2 text-blue-600 hover:underline'
                            >
                                <ArrowLeft className='h-4 w-4' />
                                Quay lại đăng nhập
                            </Link>
                            <p className='text-gray-400'>
                                Chưa có tài khoản?{' '}
                                <Link
                                    to='/register'
                                    className='text-blue-600 hover:underline'
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
