import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { BookOpen, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../lib/api'

type VerificationStatus = 'verifying' | 'success' | 'error' | 'resend'

export function EmailVerificationPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<VerificationStatus>('verifying')
    const [errorMessage, setErrorMessage] = useState('')
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (token) {
            verifyEmail(token)
        } else {
            setStatus('error')
            setErrorMessage('Token không hợp lệ')
        }
    }, [token])

    const verifyEmail = async (verificationToken: string) => {
        try {
            await authApi.verifyEmail(verificationToken)
            setStatus('success')
            toast.success('Email đã được xác thực thành công!')

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (error: any) {
            console.error('Email verification error:', error)

            // Handle specific errors
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.error?.message ||
                error.message

            // Check for "Email already verified" message
            if (errorMsg?.toLowerCase().includes('already verified')) {
                setStatus('success')
                setErrorMessage('Email đã được xác thực trước đó')
                toast.info('Email đã được xác thực trước đó')
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login')
                }, 3000)
            }
            // Check for "Invalid verification token"
            else if (errorMsg?.toLowerCase().includes('invalid')) {
                setStatus('error')
                setErrorMessage('Link xác thực không hợp lệ')
            }
            // Check for token expired (JWT error)
            else if (
                errorMsg?.toLowerCase().includes('expired') ||
                errorMsg?.toLowerCase().includes('jwt')
            ) {
                setStatus('resend')
                setErrorMessage('Link xác thực đã hết hạn')
            }
            // Generic error
            else {
                setStatus('error')
                setErrorMessage('Email verification failed')
            }
        }
    }

    const handleResendVerification = async () => {
        setIsResending(true)
        try {
            await authApi.resendVerification()
            toast.success('Email xác thực mới đã được gửi!')
            setStatus('success')
            setErrorMessage('Vui lòng kiểm tra email của bạn')
        } catch (error: any) {
            console.error('Resend verification error:', error)
            toast.error('Không thể gửi lại email. Vui lòng thử lại sau')
        } finally {
            setIsResending(false)
        }
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
                    {/* Verifying State */}
                    {status === 'verifying' && (
                        <>
                            <CardHeader className='space-y-1'>
                                <div className='flex justify-center mb-4'>
                                    <Loader2 className='h-16 w-16 text-blue-500 animate-spin' />
                                </div>
                                <CardTitle className='text-2xl text-center text-white'>
                                    Đang xác thực email...
                                </CardTitle>
                                <CardDescription className='text-center text-gray-400'>
                                    Vui lòng chờ trong giây lát
                                </CardDescription>
                            </CardHeader>
                        </>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <>
                            <CardHeader className='space-y-1'>
                                <div className='flex justify-center mb-4'>
                                    <CheckCircle className='h-16 w-16 text-green-500' />
                                </div>
                                <CardTitle className='text-2xl text-center text-white'>
                                    Xác thực thành công!
                                </CardTitle>
                                <CardDescription className='text-center text-gray-400'>
                                    Email của bạn đã được xác thực thành công
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4 text-sm text-gray-400 text-center'>
                                    <p>
                                        Bạn sẽ được chuyển đến trang đăng nhập
                                        sau 3 giây...
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => navigate('/login')}
                                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    Đăng nhập ngay
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <>
                            <CardHeader className='space-y-1'>
                                <div className='flex justify-center mb-4'>
                                    <XCircle className='h-16 w-16 text-red-500' />
                                </div>
                                <CardTitle className='text-2xl text-center text-white'>
                                    Xác thực thất bại
                                </CardTitle>
                                <CardDescription className='text-center text-gray-400'>
                                    {errorMessage ||
                                        'Link xác thực không hợp lệ hoặc đã hết hạn'}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className='flex flex-col gap-2'>
                                <Button
                                    onClick={() => navigate('/login')}
                                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    Về trang đăng nhập
                                </Button>
                                <Link
                                    to='/register'
                                    className='text-sm text-center w-full text-blue-600 hover:underline'
                                >
                                    Đăng ký tài khoản mới
                                </Link>
                            </CardFooter>
                        </>
                    )}

                    {/* Resend State - Link expired */}
                    {status === 'resend' && (
                        <>
                            <CardHeader className='space-y-1'>
                                <div className='flex justify-center mb-4'>
                                    <Mail className='h-16 w-16 text-yellow-500' />
                                </div>
                                <CardTitle className='text-2xl text-center text-white'>
                                    Link đã hết hạn
                                </CardTitle>
                                <CardDescription className='text-center text-gray-400'>
                                    {errorMessage}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4 text-sm text-gray-400'>
                                    <p className='mb-2'>
                                        Link xác thực email đã hết hạn.
                                    </p>
                                    <p>
                                        Vui lòng yêu cầu gửi lại email xác thực
                                        mới.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className='flex flex-col gap-2'>
                                <Button
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    {isResending ? (
                                        <>
                                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        'Gửi lại email xác thực'
                                    )}
                                </Button>
                                <Link
                                    to='/login'
                                    className='text-sm text-center w-full text-blue-600 hover:underline'
                                >
                                    Về trang đăng nhập
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
