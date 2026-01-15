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
import {
    BookOpen,
    AlertCircle,
    Loader2,
    Lock,
    Eye,
    EyeOff,
    Moon,
    Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'sonner'

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, loginWithGoogle, isAuthenticated, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{
        identifier?: string
        password?: string
    }>({})

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
        const newErrors: { identifier?: string; password?: string } = {}

        if (!identifier.trim()) {
            newErrors.identifier = 'Vui lòng nhập email hoặc tên người dùng'
        } else {
            // Check if it looks like an email (contains @) - validate email format
            // Otherwise treat as username - validate username format
            const isEmail = identifier.includes('@')
            if (isEmail) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
                    newErrors.identifier = 'Email không hợp lệ'
                }
            } else {
                // Username validation: 3-50 chars, letters, numbers, underscores only
                if (identifier.length < 3) {
                    newErrors.identifier =
                        'Tên người dùng phải có ít nhất 3 ký tự'
                } else if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
                    newErrors.identifier =
                        'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới'
                }
            }
        }

        if (!password.trim()) {
            newErrors.password = 'Vui lòng nhập mật khẩu'
        }

        // Nếu có lỗi, hiển thị và dừng lại
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            // Focus vào field đầu tiên bị lỗi
            if (newErrors.identifier) {
                document.getElementById('identifier')?.focus()
            } else if (newErrors.password) {
                document.getElementById('password')?.focus()
            }
            return
        }

        try {
            setLoading(true)
            await login(identifier, password)

            // Show success message
            toast.success('Đăng nhập thành công!')

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('rememberIdentifier', identifier)
            } else {
                localStorage.removeItem('rememberIdentifier')
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
                'Email/tên người dùng hoặc mật khẩu chưa chính xác'
            setError(errorMessage)

            // // Set field-specific errors if available
            // if (err.response?.status === 401) {
            //     setErrors({
            //         password: 'Email/tên người dùng hoặc mật khẩu không đúng',
            //     })
            // }
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            setLoading(true)
            await loginWithGoogle()
            toast.success('Đăng nhập Google thành công!')
            navigate('/dashboard', { replace: true })
        } catch (error) {
            toast.error('Đăng nhập Google thất bại')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Load remembered identifier on mount
    useEffect(() => {
        const rememberedIdentifier = localStorage.getItem('rememberIdentifier')
        if (rememberedIdentifier) {
            setIdentifier(rememberedIdentifier)
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

                        <form
                            onSubmit={handleSubmit}
                            className='space-y-4'
                            noValidate
                        >
                            <div className='space-y-2'>
                                <Label
                                    htmlFor='identifier'
                                    className='text-white'
                                >
                                    Email hoặc Tên người dùng
                                </Label>
                                <Input
                                    id='identifier'
                                    type='text'
                                    placeholder='email@example.com hoặc username'
                                    value={identifier}
                                    onChange={(e) => {
                                        setIdentifier(e.target.value)
                                        // Clear error when user starts typing
                                        if (errors.identifier) {
                                            setErrors({
                                                ...errors,
                                                identifier: undefined,
                                            })
                                        }
                                    }}
                                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                        errors.identifier
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                    disabled={loading}
                                />
                                {errors.identifier && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.identifier}
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
                                                setErrors({
                                                    ...errors,
                                                    password: undefined,
                                                })
                                            }
                                        }}
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.password
                                                ? 'border-red-500'
                                                : ''
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
                        <div className='relative my-6'>
                            <div className='absolute inset-0 flex items-center'>
                                <span className='w-full border-t border-[#2D2D2D]' />
                            </div>
                            <div className='relative flex justify-center text-xs uppercase'>
                                <span className='bg-[#1A1A1A] px-2 text-gray-500'>
                                    Hoặc đăng nhập với
                                </span>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <DarkOutlineButton
                                type='button'
                                disabled={loading}
                                onClick={handleGoogleLogin}
                            >
                                <svg
                                    className='mr-2 h-4 w-4'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                                        fill='#4285F4'
                                    />
                                    <path
                                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                                        fill='#34A853'
                                    />
                                    <path
                                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                                        fill='#FBBC05'
                                    />
                                    <path
                                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                                        fill='#EA4335'
                                    />
                                </svg>
                                Google
                            </DarkOutlineButton>
                            <DarkOutlineButton
                                type='button'
                                disabled={loading}
                            >
                                <svg
                                    className='mr-2 h-4 w-4'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                                </svg>
                                GitHub
                            </DarkOutlineButton>
                        </div>
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
