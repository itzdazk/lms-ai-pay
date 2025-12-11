import { Link, useNavigate, useLocation } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'sonner'
import { BookOpen, Loader2, Lock, Eye, EyeOff, Moon, Sun, AlertCircle } from 'lucide-react'

export function RegisterPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { register, isAuthenticated, user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [formData, setFormData] = useState({
        userName: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{
        userName?: string
        fullName?: string
        email?: string
        password?: string
        confirmPassword?: string
        terms?: string
    }>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false)
    const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false)

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

    const validateForm = () => {
        const newErrors: typeof errors = {}

        // Validate userName
        if (!formData.userName.trim()) {
            newErrors.userName = 'Tên đăng nhập không được để trống'
        } else if (formData.userName.length < 3) {
            newErrors.userName = 'Tên đăng nhập phải có ít nhất 3 ký tự'
        } else if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(formData.userName)) {
            newErrors.userName =
                'Tên đăng nhập chỉ được chứa chữ cái, số, gạch dưới (_) hoặc gạch ngang (-), và không được bắt đầu bằng ký tự đặc biệt'
        }

        // Validate fullName
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên không được để trống'
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        // Validate password - must contain uppercase, lowercase, number and special character
        if (!formData.password) {
            newErrors.password = 'Mật khẩu không được để trống'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
        } else {
            const hasUpperCase = /[A-Z]/.test(formData.password)
            const hasLowerCase = /[a-z]/.test(formData.password)
            const hasNumber = /[0-9]/.test(formData.password)
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(
                formData.password
            )

            if (!hasUpperCase) {
                newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ hoa'
            } else if (!hasLowerCase) {
                newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ thường'
            } else if (!hasNumber) {
                newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ số'
            } else if (!hasSpecialChar) {
                newErrors.password =
                    'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'
            }
        }

        // Validate confirmPassword
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu không khớp'
        }

        // Validate terms
        if (!formData.agreeToTerms) {
            newErrors.terms = 'Bạn cần đồng ý với điều khoản sử dụng'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            // Focus vào field đầu tiên bị lỗi
            if (errors.userName) {
                document.getElementById('userName')?.focus()
            } else if (errors.fullName) {
                document.getElementById('fullName')?.focus()
            } else if (errors.email) {
                document.getElementById('email')?.focus()
            } else if (errors.password) {
                document.getElementById('password')?.focus()
            } else if (errors.confirmPassword) {
                document.getElementById('confirmPassword')?.focus()
            }
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            await register({
                userName: formData.userName,
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
            })

            // Show success message
            toast.success('Đăng ký thành công!', {
                description: 'Vui lòng kiểm tra email để xác thực tài khoản của bạn trước khi đăng nhập.',
                duration: 6000,
            })

            // Redirect to login after a short delay to show toast
            setTimeout(() => {
                navigate('/login', { replace: true })
            }, 2000)
        } catch (error: any) {
            console.error('Register error:', error)

            // Handle validation errors from backend
            if (
                error.response?.data?.errors &&
                Array.isArray(error.response.data.errors)
            ) {
                const backendErrors: typeof errors = {}
                error.response.data.errors.forEach((err: any) => {
                    if (err.field === 'email') {
                        backendErrors.email = err.message
                    } else if (err.field === 'userName') {
                        backendErrors.userName = err.message
                    } else if (err.field === 'password') {
                        backendErrors.password = err.message
                    } else if (err.field === 'fullName') {
                        backendErrors.fullName = err.message
                    }
                })
                setErrors(backendErrors)
            }
            // Handle 409 - conflict (email/username already exists)
            else if (error.response?.status === 409) {
                const errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.error?.message
                if (errorMessage?.toLowerCase().includes('email')) {
                    setErrors({ email: 'Email đã được sử dụng' })
                } else if (errorMessage?.toLowerCase().includes('username')) {
                    setErrors({ userName: 'Tên đăng nhập đã được sử dụng' })
                }
            }
            // Toast is already handled by client.ts interceptor
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-white dark:bg-black py-2 px-4'>
            <div className='w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl px-8 py-2 relative'>
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
                    className='flex items-center justify-center gap-2 mb-4'
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
                            Đăng ký tài khoản
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className='space-y-4' noValidate>
                            <div className='space-y-2'>
                                <Label
                                    htmlFor='userName'
                                    className='text-white'
                                >
                                    Tên đăng nhập
                                </Label>
                                <Input
                                    id='userName'
                                    type='text'
                                    placeholder='username123'
                                    value={formData.userName}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            userName: e.target.value,
                                        })
                                        // Clear error when user starts typing
                                        if (errors.userName) {
                                            setErrors({ ...errors, userName: undefined })
                                        }
                                    }}
                                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                        errors.userName ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.userName && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.userName}
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <Label
                                    htmlFor='fullName'
                                    className='text-white'
                                >
                                    Họ và tên
                                </Label>
                                <Input
                                    id='fullName'
                                    type='text'
                                    placeholder='Nguyễn Văn A'
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            fullName: e.target.value,
                                        })
                                        // Clear error when user starts typing
                                        if (errors.fullName) {
                                            setErrors({ ...errors, fullName: undefined })
                                        }
                                    }}
                                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                        errors.fullName ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.fullName && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='email' className='text-white'>
                                    Email
                                </Label>
                                <Input
                                    id='email'
                                    type='email'
                                    placeholder='name@example.com'
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                        // Clear error when user starts typing
                                        if (errors.email) {
                                            setErrors({ ...errors, email: undefined })
                                        }
                                    }}
                                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                        errors.email ? 'border-red-500' : ''
                                    }`}
                                />
                                {errors.email && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <Label
                                    htmlFor='password'
                                    className='text-white'
                                >
                                    Mật khẩu
                                </Label>
                                <div className='relative'>
                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        id='password'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder='••••••••'
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                password: e.target.value,
                                            })
                                            // Clear error when user starts typing
                                            if (errors.password) {
                                                setErrors({ ...errors, password: undefined })
                                            }
                                        }}
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.password
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
                                    >
                                        {showPassword ? (
                                            <EyeOff className='h-4 w-4' />
                                        ) : (
                                            <Eye className='h-4 w-4' />
                                        )}
                                    </button>
                                </div>
                                {errors.password ? (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.password}
                                    </p>
                                ) : (
                                    <p className='text-xs text-gray-500'>
                                        Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ
                                        thường, số và ký tự đặc biệt
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <Label
                                    htmlFor='confirmPassword'
                                    className='text-white'
                                >
                                    Xác nhận mật khẩu
                                </Label>
                                {/* THAY ĐỔI: Thay thế Input cũ với div wrapper + Input + icon toggle */}
                                <div className='relative'>
                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        id='confirmPassword'
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        placeholder='••••••••'
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                confirmPassword: e.target.value,
                                            })
                                            // Clear error when user starts typing
                                            if (errors.confirmPassword) {
                                                setErrors({ ...errors, confirmPassword: undefined })
                                            }
                                        }}
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.confirmPassword
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className='h-4 w-4' />
                                        ) : (
                                            <Eye className='h-4 w-4' />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className='text-xs text-red-500 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <div className='flex items-start space-x-2'>
                                <Checkbox
                                    id='terms'
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            agreeToTerms: checked as boolean,
                                        })
                                    }
                                    className={`mt-1 ${
                                        errors.terms ? 'border-red-500' : ''
                                    }`}
                                />
                                <label
                                    htmlFor='terms'
                                    className='text-sm leading-relaxed cursor-pointer text-gray-300'
                                >
                                    Tôi đồng ý với{' '}
                                    <button
                                        type='button'
                                        onClick={() => setIsTermsDialogOpen(true)}
                                        className=' text-blue-600 hover:underline cursor-pointer'
                                    >
                                        Điều khoản sử dụng
                                    </button>{' '}
                                    và{' '}
                                    <button
                                        type='button'
                                        onClick={() => setIsPrivacyDialogOpen(true)}
                                        className='text-blue-600 hover:underline cursor-pointer'
                                    >
                                        Chính sách bảo mật
                                    </button>
                                </label>
                            </div>
                            {errors.terms && (
                                <p className='text-xs text-red-500 flex items-center gap-1'>
                                    <AlertCircle className='h-3 w-3' />
                                    {errors.terms}
                                </p>
                            )}

                            <DarkOutlineButton
                                type='submit'
                                className='w-full'
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    'Đăng ký'
                                )}
                            </DarkOutlineButton>
                        </form>

                        <div className='relative my-6'>
                            <div className='absolute inset-0 flex items-center'>
                                <span className='w-full border-t border-[#2D2D2D]' />
                            </div>
                            <div className='relative flex justify-center text-xs uppercase'>
                                <span className='bg-[#1A1A1A] px-2 text-gray-500'>
                                    Hoặc đăng ký với
                                </span>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <DarkOutlineButton
                                type='button'
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                            Đã có tài khoản?{' '}
                            <Link
                                to='/login'
                                className='text-blue-600 hover:underline'
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Terms Dialog */}
            <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Điều khoản sử dụng
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6 space-y-6'>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    1
                                </span>
                                Chấp nhận điều khoản
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Bằng việc truy cập và sử dụng nền tảng học tập trực tuyến
                                này, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản
                                và điều kiện sử dụng được nêu trong tài liệu này.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    2
                                </span>
                                Tài khoản người dùng
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Bạn chịu trách nhiệm duy trì tính bảo mật của tài khoản và
                                mật khẩu. Bạn đồng ý thông báo ngay lập tức cho chúng tôi về
                                bất kỳ vi phạm bảo mật nào.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    3
                                </span>
                                Sử dụng dịch vụ
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Bạn đồng ý sử dụng dịch vụ một cách hợp pháp và không được
                                sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp hoặc trái
                                phép nào.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    4
                                </span>
                                Quyền sở hữu trí tuệ
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Tất cả nội dung trên nền tảng, bao gồm nhưng không giới hạn
                                ở văn bản, đồ họa, logo, hình ảnh, và phần mềm, là tài sản
                                của chúng tôi hoặc các bên cấp phép của chúng tôi.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    5
                                </span>
                                Giới hạn trách nhiệm
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại trực
                                tiếp, gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào phát
                                sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Privacy Dialog */}
            <Dialog open={isPrivacyDialogOpen} onOpenChange={setIsPrivacyDialogOpen}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Chính sách bảo mật
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Chúng tôi cam kết bảo vệ quyền riêng tư của bạn
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6 space-y-6'>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    1
                                </span>
                                Thu thập thông tin
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Chúng tôi thu thập thông tin cá nhân của bạn khi bạn đăng ký
                                tài khoản, sử dụng dịch vụ, hoặc liên hệ với chúng tôi. Thông
                                tin này bao gồm tên, email, và các thông tin khác mà bạn
                                cung cấp.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    2
                                </span>
                                Sử dụng thông tin
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Chúng tôi sử dụng thông tin của bạn để cung cấp, duy trì và
                                cải thiện dịch vụ, xử lý giao dịch, gửi thông báo, và cung
                                cấp hỗ trợ khách hàng.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    3
                                </span>
                                Bảo mật thông tin
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức
                                phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập,
                                thay đổi, tiết lộ hoặc phá hủy trái phép.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    4
                                </span>
                                Chia sẻ thông tin
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Chúng tôi không bán, trao đổi hoặc cho thuê thông tin cá nhân
                                của bạn cho bên thứ ba. Chúng tôi chỉ chia sẻ thông tin khi
                                có yêu cầu pháp lý hoặc để bảo vệ quyền và tài sản của chúng
                                tôi.
                            </p>
                        </div>
                        <div className='pb-6 border-b border-[#2D2D2D] last:border-b-0'>
                            <h3 className='text-base font-semibold text-white mb-3 flex items-center gap-2'>
                                <span className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                                    5
                                </span>
                                Quyền của bạn
                            </h3>
                            <p className='text-sm leading-7 text-gray-300 pl-8'>
                                Bạn có quyền truy cập, chỉnh sửa, xóa hoặc yêu cầu ngừng xử
                                lý thông tin cá nhân của mình bất cứ lúc nào bằng cách liên
                                hệ với chúng tôi.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
