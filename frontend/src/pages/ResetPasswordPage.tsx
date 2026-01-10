import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
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
import { BookOpen, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../lib/api/auth'

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{
        password?: string
        confirmPassword?: string
    }>({})

    const validatePassword = () => {
        const newErrors: typeof errors = {}

        // Validate password - must contain uppercase, lowercase, number and special character
        if (!password) {
            newErrors.password = 'Mật khẩu không được để trống'
        } else if (password.length < 8) {
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
        } else {
            const hasUpperCase = /[A-Z]/.test(password)
            const hasLowerCase = /[a-z]/.test(password)
            const hasNumber = /[0-9]/.test(password)
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

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
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu không khớp'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast.error('Token không hợp lệ')
            return
        }

        if (!validatePassword()) {
            return
        }

        setIsLoading(true)
        setErrors({})

        try {
            await authApi.resetPassword(token, password)
            toast.success('Mật khẩu đã được đặt lại thành công!')

            // Redirect to login page after 1.5 seconds
            setTimeout(() => {
                navigate('/login')
            }, 1500)
        } catch (error: any) {
            console.error('Reset password error:', error)

            // Handle specific errors
            if (error.response?.status === 400) {
                const errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.error?.message
                if (errorMessage?.toLowerCase().includes('token')) {
                    toast.error('Token không hợp lệ hoặc đã hết hạn')
                } else if (errorMessage?.toLowerCase().includes('password')) {
                    setErrors({ password: errorMessage })
                }
            } else if (error.response?.status === 404) {
                toast.error('Không tìm thấy người dùng')
            }
            // Other errors are handled by client.ts interceptor
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4'>
                <div className='w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl p-8'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white text-center'>
                                Token không hợp lệ
                            </CardTitle>
                            <CardDescription className='text-gray-400 text-center'>
                                Link khôi phục mật khẩu không hợp lệ hoặc đã hết
                                hạn
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button
                                asChild
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                            >
                                <Link to='/forgot-password'>
                                    Yêu cầu link mới
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-white dark:bg-black py-12 px-4'>
            <div className='w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl p-8'>
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
                            Đặt lại mật khẩu
                        </CardTitle>
                        <CardDescription className='text-center text-gray-400'>
                            Nhập mật khẩu mới của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='space-y-2'>
                                <Label
                                    htmlFor='password'
                                    className='text-white'
                                >
                                    Mật khẩu mới
                                </Label>
                                <div className='relative'>
                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        id='password'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        placeholder='••••••••'
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.password
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                        required
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
                                    <p className='text-xs text-red-500'>
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
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                                            errors.confirmPassword
                                                ? 'border-red-500'
                                                : ''
                                        }`}
                                        required
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
                                    <p className='text-xs text-red-500'>
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <Button
                                type='submit'
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Đặt lại mật khẩu'
                                )}
                            </Button>
                        </form>
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
