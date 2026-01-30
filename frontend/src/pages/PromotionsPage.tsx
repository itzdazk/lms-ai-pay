import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { couponsApi } from '../lib/api/coupons'
import type { AvailableCoupon } from '../lib/api/types'
import {
    Copy,
    Check,
    Clock,
    Users,
    Tag,
    ShoppingCart,
    Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Button } from '../components/ui/button'

// Countdown Timer Component - Dark Theme
const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference =
                new Date(endDate).getTime() - new Date().getTime()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                })
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(timer)
    }, [endDate])

    if (
        timeLeft.days === 0 &&
        timeLeft.hours === 0 &&
        timeLeft.minutes === 0 &&
        timeLeft.seconds === 0
    ) {
        return (
            <div className='text-xs text-red-400 font-semibold'>Đã hết hạn</div>
        )
    }

    return (
        <div className='flex items-center gap-2 text-xs font-mono'>
            {timeLeft.days > 0 && (
                <div className='bg-[#2D2D2D] text-blue-400 px-2 py-1 rounded'>
                    <span className='font-bold'>{timeLeft.days}</span>
                    <span className='text-[10px] ml-0.5 text-gray-400'>
                        ngày
                    </span>
                </div>
            )}
            <div className='bg-[#2D2D2D] text-blue-400 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5 text-gray-400'>giờ</span>
            </div>
            <div className='bg-[#2D2D2D] text-blue-400 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5 text-gray-400'>phút</span>
            </div>
            <div className='bg-[#2D2D2D] text-blue-400 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5 text-gray-400'>giây</span>
            </div>
        </div>
    )
}

const PromotionsPage: React.FC = () => {
    const navigate = useNavigate()
    const [coupons, setCoupons] = useState<AvailableCoupon[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 12

    useEffect(() => {
        fetchCoupons()
    }, [page])

    const fetchCoupons = async () => {
        try {
            setLoading(true)
            const response = await couponsApi.getAvailableCoupons({
                page,
                limit,
            })
            setCoupons(response.data)
            setTotal(response.pagination.total)
        } catch (error: any) {
            console.error('Error fetching coupons:', error)
            toast.error(
                error.response?.data?.message ||
                    'Không thể tải danh sách mã giảm giá',
            )
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedCode(code)
            toast.success('Đã sao chép mã giảm giá!')
            setTimeout(() => setCopiedCode(null), 2000)
        } catch (error) {
            toast.error('Không thể sao chép mã')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount)
    }

    const formatDiscount = (coupon: AvailableCoupon) => {
        if (coupon.type === 'PERCENT') {
            return `Giảm ${coupon.value}%`
        } else if (coupon.type === 'FIXED' || coupon.type === 'NEW_USER') {
            return `Giảm ${formatCurrency(coupon.value)}`
        }
        return ''
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
    }

    const getApplicableText = (coupon: AvailableCoupon) => {
        if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
            return `Áp dụng cho: ${coupon.applicableCourses.map((c) => c.title).join(', ')}`
        }
        if (
            coupon.applicableCategories &&
            coupon.applicableCategories.length > 0
        ) {
            return `Áp dụng cho danh mục: ${coupon.applicableCategories.map((c) => c.name).join(', ')}`
        }
        return 'Áp dụng cho tất cả khóa học'
    }

    const getRemainingUses = (coupon: AvailableCoupon) => {
        if (!coupon.maxUses) return null
        const remaining = coupon.maxUses - coupon.usesCount
        return remaining > 0 ? remaining : 0
    }

    const handleUseCoupon = (code: string) => {
        // Navigate to courses page with coupon code
        navigate(`/courses?coupon=${code}`)
    }

    // Loading State - Dark Theme
    if (loading && coupons.length === 0) {
        return (
            <div className='bg-background min-h-screen'>
                {/* Header Section */}
                <div className='bg-[#1A1A1A] border-b border-[#2d2d2d]'>
                    <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                        <div className='flex items-center gap-3 mb-2'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-black border border-[#2D2D2D]'>
                                <Percent className='h-6 w-6 text-blue-400' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-400 uppercase tracking-[0.25em]'>
                                    Promotions
                                </p>
                                <h1 className='text-2xl md:text-3xl font-bold text-white'>
                                    Mã giảm giá HOT nhất
                                </h1>
                            </div>
                        </div>
                        <p className='text-base text-gray-300 leading-relaxed ml-15'>
                            Đang tải danh sách khuyến mãi...
                        </p>
                    </div>
                </div>
                {/* Loading Skeleton */}
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card
                                key={i}
                                className='bg-[#1A1A1A] border-[#2D2D2D] animate-pulse'
                            >
                                <CardContent className='p-6'>
                                    <div className='h-6 bg-[#2D2D2D] rounded w-3/4 mb-4'></div>
                                    <div className='h-8 bg-[#2D2D2D] rounded w-1/2 mb-4'></div>
                                    <div className='h-4 bg-[#2D2D2D] rounded w-2/3 mb-2'></div>
                                    <div className='h-4 bg-[#2D2D2D] rounded w-1/2'></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='bg-background min-h-screen'>
            {/* Header Section */}
            <div className='bg-[#1A1A1A] border-b border-[#2d2d2d]'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-black border border-[#2D2D2D]'>
                                <Percent className='h-6 w-6 text-blue-400' />
                            </div>
                            <div>
                                <p className='text-sm text-gray-400 uppercase tracking-[0.25em]'>
                                    Promotions
                                </p>
                                <h1 className='text-2xl md:text-3xl font-bold text-white'>
                                    Mã giảm giá HOT nhất
                                </h1>
                                <p className='text-gray-400 mt-1'>
                                    Khám phá các ưu đãi hấp dẫn cho khóa học của
                                    bạn
                                </p>
                            </div>
                        </div>
                        {/* Stats */}
                        <div className='flex gap-4'>
                            <div className='bg-black rounded-xl p-4 border border-[#2D2D2D] min-w-[100px]'>
                                <div className='text-2xl font-bold text-white'>
                                    {total}
                                </div>
                                <div className='text-xs text-gray-400 mt-1'>
                                    Mã khả dụng
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                {/* Coupons Grid */}
                {coupons.length === 0 ? (
                    <Card className='p-12 text-center bg-[#1A1A1A] border-[#2D2D2D]'>
                        <div className='flex h-20 w-20 items-center justify-center rounded-full bg-black border border-[#2D2D2D] mx-auto mb-6'>
                            <Tag className='h-10 w-10 text-gray-500' />
                        </div>
                        <h3 className='text-2xl font-semibold text-white mb-2'>
                            Chưa có mã giảm giá
                        </h3>
                        <p className='text-gray-400 mb-8'>
                            Hiện tại chưa có mã giảm giá nào khả dụng. Vui lòng
                            quay lại sau!
                        </p>
                        <DarkOutlineButton onClick={() => navigate('/courses')}>
                            Khám phá khóa học
                        </DarkOutlineButton>
                    </Card>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {coupons.map((coupon) => {
                            const remaining = getRemainingUses(coupon)
                            const isCopied = copiedCode === coupon.code

                            return (
                                <Card
                                    key={coupon.id}
                                    className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-blue-500/40 transition-all duration-300 overflow-hidden flex flex-col min-h-[340px]'
                                >
                                    {/* Top accent border */}
                                    <div className='h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'></div>

                                    <CardContent className='p-6 flex flex-col flex-1'>
                                        {/* Coupon Code */}
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='flex items-center space-x-2'>
                                                <Tag className='text-blue-400 w-5 h-5' />
                                                <span className='text-xl font-bold text-white'>
                                                    {coupon.code}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(coupon.code)
                                                }
                                                className='p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors'
                                                title='Sao chép mã'
                                            >
                                                {isCopied ? (
                                                    <Check className='w-5 h-5 text-green-400' />
                                                ) : (
                                                    <Copy className='w-5 h-5 text-gray-400' />
                                                )}
                                            </button>
                                        </div>

                                        {/* Discount Amount */}
                                        <div className='mb-4'>
                                            <div className='text-2xl font-bold text-blue-400'>
                                                {formatDiscount(coupon)}
                                            </div>
                                            {coupon.type === 'PERCENT' &&
                                                coupon.maxDiscount && (
                                                    <p className='text-sm text-gray-500 mt-1'>
                                                        Tối đa{' '}
                                                        {formatCurrency(
                                                            coupon.maxDiscount,
                                                        )}
                                                    </p>
                                                )}
                                        </div>

                                        {/* Applicable Info */}
                                        <p className='text-sm text-gray-400 mb-4 line-clamp-2'>
                                            {getApplicableText(coupon)}
                                        </p>

                                        {/* Min Order Value */}
                                        {coupon.minOrderValue && (
                                            <div className='flex items-center text-sm text-gray-400 mb-3'>
                                                <ShoppingCart className='w-4 h-4 mr-2 text-gray-500' />
                                                <span>
                                                    Đơn tối thiểu:{' '}
                                                    {formatCurrency(
                                                        coupon.minOrderValue,
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {/* Validity Period */}
                                        <div className='mb-3'>
                                            <div className='flex items-center text-sm text-gray-400 mb-2'>
                                                <Clock className='w-4 h-4 mr-2 text-gray-500' />
                                                <span>
                                                    Hết hạn:{' '}
                                                    {formatDateTime(
                                                        coupon.endDate,
                                                    )}
                                                </span>
                                            </div>
                                            {/* Countdown Timer */}
                                            <div className='ml-6'>
                                                <CountdownTimer
                                                    endDate={coupon.endDate}
                                                />
                                            </div>
                                        </div>

                                        {/* Usage Info */}
                                        {remaining !== null && (
                                            <div className='flex items-center text-sm text-gray-400 mb-4'>
                                                <Users className='w-4 h-4 mr-2 text-gray-500' />
                                                <span>
                                                    Còn{' '}
                                                    <span className='text-white font-semibold'>
                                                        {coupon.maxUsesPerUser}
                                                    </span>{' '}
                                                    lượt sử dụng
                                                </span>
                                            </div>
                                        )}

                                        {/* Action Button - pushed to bottom */}
                                        <div className='mt-auto pt-4'>
                                            <Button
                                                onClick={() =>
                                                    handleUseCoupon(coupon.code)
                                                }
                                                variant='blue'
                                                className='w-full'
                                            >
                                                Sử dụng ngay
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className='flex items-center justify-center gap-2 flex-wrap mt-8'>
                        <DarkOutlineButton
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            size='sm'
                        >
                            Trước
                        </DarkOutlineButton>
                        <span className='px-4 py-2 text-gray-400'>
                            Trang {page} / {Math.ceil(total / limit)}
                        </span>
                        <DarkOutlineButton
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= Math.ceil(total / limit)}
                            size='sm'
                        >
                            Sau
                        </DarkOutlineButton>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PromotionsPage
