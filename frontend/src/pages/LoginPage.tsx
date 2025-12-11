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
import { Checkbox } from '../components/ui/checkbox'
import { BookOpen, AlertCircle, Loader2, Lock, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'sonner'

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {}
    )

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            // Redirect based on user role
            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true })
            } else if (user.role === 'INSTRUCTOR') {
                navigate('/instructor/dashboard', { replace: true })
            } else {
                navigate('/dashboard', { replace: true })
            }
        }
    }, [isAuthenticated, user, navigate])

    // Show message from register page
    useEffect(() => {
        const message = (location.state as any)?.message
        if (message) {
            toast.info(message, {
                duration: 6000,
            })
            // Clear state to prevent showing message again on refresh
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Reset error state
        setError('')
        setErrors({})

        // Validate inputs với thông báo cụ thể
        const newErrors: { email?: string; password?: string } = {}

        if (!email.trim()) {
            newErrors.email = 'Vui lòng nhập email'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        if (!password.trim()) {
            newErrors.password = 'Vui lòng nhập mật khẩu'
        }

        // Nếu có lỗi, hiển thị và dừng lại
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            // Focus vào field đầu tiên bị lỗi
            if (newErrors.email) {
                document.getElementById('email')?.focus()
            } else if (newErrors.password) {
                document.getElementById('password')?.focus()
            }
            return
        }

        try {
            setLoading(true)
            await login(email, password)

            // Show success message
            toast.success('Đăng nhập thành công!')

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('rememberEmail', email)
            } else {
                localStorage.removeItem('rememberEmail')
            }

            // Redirect based on user role
            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                if (user.role === 'ADMIN') {
                    navigate('/admin/dashboard')
                } else if (user.role === 'INSTRUCTOR') {
                    navigate('/instructor/dashboard')
                } else {
                    navigate('/dashboard')
                }
            } else {
                navigate('/dashboard')
            }
        } catch (err: any) {
            console.error('Login error:', err)
            // Error toast is already shown by API client interceptor for non-auth requests
            // For auth requests, we handle it here
            const errorMessage =
                err.response?.data?.message ||
                'Email hoặc mật khẩu chưa chính xác'
            setError(errorMessage)

            // Set field-specific errors if available
            if (err.response?.status === 401) {
                setErrors({ password: 'Email hoặc mật khẩu không đúng' })
            }
        } finally {
            setLoading(false)
        }
    }

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberEmail')
        if (rememberedEmail) {
            setEmail(rememberedEmail)
            setRememberMe(true)
        }
    }, [])

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
                    className='flex items-center justify-center gap-2 mb-6'
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
                            Đăng nhập
                        </CardTitle>
                        <CardDescription className='text-center text-gray-400'>
                            Nhập email và mật khẩu để truy cập tài khoản
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Error Alert */}
                        {error && (
                            <div className='mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2'>
                                <AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0 mt-0.5' />
                                <p className='text-sm text-red-500'>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className='space-y-4' noValidate>
                            <div className='space-y-2'>
                                <Label htmlFor='email' className='text-white'>
                                    Email
                                </Label>
                                <Input
                                    id='email'
                                    type='email'
                                    placeholder='name@example.com'
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        // Clear error when user starts typing
                                        if (errors.email) {
                                            setErrors({ ...errors, email: undefined })
                                        }
                                    }}
                                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                        errors.email ? 'border-red-500' : ''
                                    }`}
                                    disabled={loading}
                                />
                                {errors.email && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label
                                        htmlFor='password'
                                        className='text-white'
                                    >
                                        Mật khẩu
                                    </Label>
                                    <Link
                                        to='/forgot-password'
                                        className='text-sm text-blue-600 hover:underline'
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <div className='relative'>
                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        id='password'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder='••••••••'
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            // Clear error when user starts typing
                                            if (errors.password) {
                                                setErrors({ ...errors, password: undefined })
                                            }
                                        }}
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.password ? 'border-red-500' : ''
                                        }`}
                                        disabled={loading}
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black'
                                    >
                                        {showPassword ? (
                                            <EyeOff className='h-4 w-4' />
                                        ) : (
                                            <Eye className='h-4 w-4' />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    id='remember'
                                    checked={rememberMe}
                                    onCheckedChange={(checked) =>
                                        setRememberMe(checked as boolean)
                                    }
                                    disabled={loading}
                                />
                                <label
                                    htmlFor='remember'
                                    className='text-sm leading-none text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                >
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>
                            <DarkOutlineButton
                                type='submit'
                                className='w-full'
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </DarkOutlineButton>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <div className='text-sm text-center w-full text-gray-400'>
                            Chưa có tài khoản?{' '}
                            <Link
                                to='/register'
                                className='text-blue-600 hover:underline'
                            >
                                Đăng ký ngay
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
