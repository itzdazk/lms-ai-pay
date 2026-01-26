import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { couponsApi } from '../lib/api/coupons'
import type { AvailableCoupon } from '../lib/api/types'
import { Copy, Check, Clock, Users, Tag, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

// Countdown Timer Component
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
            <div className='text-xs text-red-600 font-semibold'>Đã hết hạn</div>
        )
    }

    return (
        <div className='flex items-center gap-2 text-xs font-mono'>
            {timeLeft.days > 0 && (
                <div className='bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                    <span className='font-bold'>{timeLeft.days}</span>
                    <span className='text-[10px] ml-0.5'>ngày</span>
                </div>
            )}
            <div className='bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5'>giờ</span>
            </div>
            <div className='bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5'>phút</span>
            </div>
            <div className='bg-blue-100 text-blue-700 px-2 py-1 rounded'>
                <span className='font-bold'>
                    {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className='text-[10px] ml-0.5'>giây</span>
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

    if (loading && coupons.length === 0) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
                <div className='container mx-auto px-4 py-8'>
                    <div className='text-center mb-12'>
                        <h1 className='text-4xl font-bold text-gray-800 mb-4'>
                            Mã giảm giá HOT nhất
                        </h1>
                        <p className='text-gray-600'>
                            Đang tải danh sách khuyến mãi...
                        </p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className='bg-white rounded-2xl shadow-lg p-6 animate-pulse'
                            >
                                <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
                                <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
                                <div className='h-4 bg-gray-200 rounded w-2/3'></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
            <div className='container mx-auto px-4 py-8'>
                {/* Header */}
                <div className='text-center mb-12'>
                    <h1 className='text-4xl md:text-5xl font-bold text-black mb-4'>
                        Mã giảm giá HOT nhất
                    </h1>
                    <p className='text-gray-600 text-lg'>
                        Khám phá các ưu đãi hấp dẫn cho khóa học của bạn
                    </p>
                </div>

                {/* Coupons Grid */}
                {coupons.length === 0 ? (
                    <div className='text-center py-16'>
                        <div className='inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6'>
                            <Tag className='w-12 h-12 text-gray-400' />
                        </div>
                        <h3 className='text-2xl font-semibold text-gray-700 mb-2'>
                            Chưa có mã giảm giá
                        </h3>
                        <p className='text-gray-500 mb-8'>
                            Hiện tại chưa có mã giảm giá nào khả dụng. Vui lòng
                            quay lại sau!
                        </p>
                        <button
                            onClick={() => navigate('/courses')}
                            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            Khám phá khóa học
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {coupons.map((coupon) => {
                            const remaining = getRemainingUses(coupon)
                            const isCopied = copiedCode === coupon.code

                            return (
                                <div
                                    key={coupon.id}
                                    className={`
                                            group relative 
                                            bg-white rounded-2xl shadow-lg 
                                            hover:shadow-2xl transition-all duration-300 
                                            overflow-hidden
                                            flex flex-col             
                                            min-h-[340px]               
                                            `}
                                >
                                    {/* Gradient Background */}
                                    <div className='absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'></div>

                                    <div className='p-6 flex flex-col flex-1'>
                                        {' '}
                                        {/* ← thêm flex-1 */}
                                        {/* Coupon Code */}
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='flex items-center space-x-2'>
                                                <Tag className='text-blue-600 w-5 h-5' />
                                                <span className='text-2xl font-bold text-gray-800'>
                                                    {coupon.code}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(coupon.code)
                                                }
                                                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                                                title='Sao chép mã'
                                            >
                                                {isCopied ? (
                                                    <Check className='w-5 h-5 text-green-600' />
                                                ) : (
                                                    <Copy className='w-5 h-5 text-gray-600' />
                                                )}
                                            </button>
                                        </div>
                                        {/* Discount Amount */}
                                        <div className='mb-4'>
                                            <div className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
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
                                        <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                                            {getApplicableText(coupon)}
                                        </p>
                                        {/* Min Order Value – nếu không có thì không render, không sao */}
                                        {coupon.minOrderValue && (
                                            <div className='flex items-center text-sm text-gray-600 mb-3'>
                                                <ShoppingCart className='w-4 h-4 mr-2' />
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
                                            <div className='flex items-center text-sm text-gray-600 mb-2'>
                                                <Clock className='w-4 h-4 mr-2' />
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
                                        {/* Usage Info – nếu không có thì không render */}
                                        {remaining !== null && (
                                            <div className='flex items-center text-sm text-gray-600 mb-4'>
                                                <Users className='w-4 h-4 mr-2' />
                                                <span>
                                                    Còn{' '}
                                                    <b>
                                                        {coupon.maxUsesPerUser}
                                                    </b>{' '}
                                                    lượt sử dụng
                                                </span>
                                            </div>
                                        )}
                                        {/* Phần này sẽ bị đẩy xuống đáy nhờ mt-auto */}
                                        <div className='mt-auto pt-4'>
                                            {' '}
                                            {/* ← thêm mt-auto + padding nếu cần */}
                                            <button
                                                onClick={() =>
                                                    handleUseCoupon(coupon.code)
                                                }
                                                className='w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg'
                                            >
                                                Sử dụng ngay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className='flex justify-center mt-12 space-x-2'>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className='px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        >
                            Trước
                        </button>
                        <span className='px-4 py-2 bg-white border border-gray-300 rounded-lg'>
                            Trang {page} / {Math.ceil(total / limit)}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= Math.ceil(total / limit)}
                            className='px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PromotionsPage
