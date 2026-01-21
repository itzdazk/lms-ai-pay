import { useState, useEffect } from 'react'
import { BookOpen, Clock, Sparkles, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import type {
    Course,
    PublicCourse,
    ApplyCouponResponse,
} from '../../lib/api/types'
import {
    formatDuration,
    formatPrice,
    getCoursePrice,
} from '../../lib/courseUtils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Skeleton } from '../ui/skeleton'
import { CouponInput } from './CouponInput'

type OrderSummaryProps = {
    course?: PublicCourse | Course | null
    loading?: boolean
    className?: string
    showCourseMeta?: boolean
    showCouponInput?: boolean
    onPriceChange?: (finalPrice: number) => void
    onCouponApplied?: (couponCode: string) => void
    onCouponRemoved?: () => void
}

export function OrderSummary({
    course,
    loading,
    className,
    showCourseMeta = true,
    showCouponInput = true,
    onPriceChange,
    onCouponApplied,
    onCouponRemoved,
}: OrderSummaryProps) {
    const [appliedCoupon, setAppliedCoupon] =
        useState<ApplyCouponResponse | null>(null)

    // Calculate price info and final price (must be before early returns)
    const priceInfo = course
        ? getCoursePrice({
              price: course.price ?? course.originalPrice,
              discountPrice: course.discountPrice,
              originalPrice: course.originalPrice ?? course.price,
          })
        : null

    const finalPrice =
        priceInfo && appliedCoupon
            ? appliedCoupon.finalPrice
            : priceInfo?.currentPrice || 0

    // Notify parent component when final price changes
    useEffect(() => {
        if (onPriceChange && !loading && course && priceInfo) {
            onPriceChange(finalPrice)
        }
    }, [finalPrice, onPriceChange, loading, course, priceInfo])

    const handleCouponApplied = (couponData: ApplyCouponResponse) => {
        setAppliedCoupon(couponData)
        // Notify parent with coupon code
        if (onCouponApplied) {
            onCouponApplied(couponData.couponCode)
        }
    }

    const handleCouponRemoved = () => {
        setAppliedCoupon(null)
        // Notify parent
        if (onCouponRemoved) {
            onCouponRemoved()
        }
    }

    // Early returns AFTER all hooks
    if (loading) {
        return (
            <Card
                className={`bg-[#1A1A1A] border-[#2D2D2D] ${className || ''}`}
            >
                <CardHeader>
                    <CardTitle className='text-white'>
                        Chi tiết đơn hàng
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Skeleton className='h-32 w-full rounded-lg' />
                    <div className='space-y-2'>
                        <Skeleton className='h-4 w-3/4' />
                        <Skeleton className='h-4 w-1/2' />
                    </div>
                    <Separator className='bg-[#2D2D2D]' />
                    <div className='space-y-2'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-5/6' />
                        <Skeleton className='h-4 w-2/3' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!course || !priceInfo) {
        return (
            <Card
                className={`bg-[#1A1A1A] border-[#2D2D2D] ${className || ''}`}
            >
                <CardHeader>
                    <CardTitle className='text-white'>
                        Chi tiết đơn hàng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-gray-400'>
                        Không tìm thấy thông tin khóa học. Vui lòng thử lại.
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Calculate discount amounts
    const courseDiscountAmount = priceInfo.hasDiscount
        ? priceInfo.originalPrice - priceInfo.currentPrice
        : 0
    const couponDiscountAmount = appliedCoupon?.discountAmount || 0

    const lessonsCount =
        (course as PublicCourse).totalLessons ?? (course as Course).lessonsCount
    const durationHours = (course as PublicCourse).durationHours ?? 0
    const thumbnail =
        (course as PublicCourse).thumbnailUrl ||
        (course as Course & { thumbnail?: string }).thumbnail

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className || ''}`}>
            <CardHeader>
                <CardTitle className='text-white'>Chi tiết đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div>
                    {thumbnail && (
                        <img
                            src={thumbnail}
                            alt={course.title}
                            className='w-full h-50 object-cover rounded-lg mb-3'
                        />
                    )}
                    <h3 className='font-semibold text-xl mb-2 line-clamp-2 text-white'>
                        {course.title}
                    </h3>
                    <p className='mb-2 text-gray-400 line-clamp-2'>
                        {course.description}
                    </p>
                    {course.instructor?.fullName && showCourseMeta && (
                        <p className='text-sm text-gray-400 mb-3'>
                            {course.instructor.fullName}
                        </p>
                    )}

                    {showCourseMeta && (
                        <div className='space-y-2 text-sm text-gray-400'>
                            <div className='flex items-center gap-2'>
                                <BookOpen className='h-4 w-4' />
                                <span>{lessonsCount || 0} bài học</span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Clock className='h-4 w-4' />
                                <span>
                                    {formatDuration(durationHours / 60)}
                                </span>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Sparkles className='h-4 w-4' />
                                <span>Chứng chỉ hoàn thành</span>
                            </div>
                        </div>
                    )}
                </div>

                <Separator className='bg-[#2D2D2D]' />

                <div className='space-y-3'>
                    <div className='flex justify-between text-gray-400'>
                        <span>Giá gốc:</span>
                        <span
                            className={
                                priceInfo.hasDiscount ? 'line-through' : ''
                            }
                        >
                            {formatPrice(priceInfo.originalPrice)}
                        </span>
                    </div>

                    {priceInfo.hasDiscount && (
                        <div className='flex justify-between text-green-400'>
                            <span>Giảm giá khóa học:</span>
                            <span>-{formatPrice(courseDiscountAmount)}</span>
                        </div>
                    )}

                    {/* Coupon input */}
                    {!showCouponInput && (
                        <div className='space-y-2'>
                            <CouponInput
                                orderTotal={priceInfo.currentPrice}
                                courseIds={[course.id]}
                                onCouponApplied={handleCouponApplied}
                                onCouponRemoved={handleCouponRemoved}
                            />
                            <div className='flex mt-1'>
                                <Link
                                    to='/promotions'
                                    target='_blank'
                                    className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline'
                                >
                                    <Tag className='w-3 h-3' />
                                    Danh sách mã giảm giá
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Show coupon discount if applied */}
                    {appliedCoupon && (
                        <div className='flex justify-between text-green-400'>
                            <span>Giảm giá từ mã:</span>
                            <span>-{formatPrice(couponDiscountAmount)}</span>
                        </div>
                    )}

                    <Separator className='bg-[#2D2D2D]' />
                    <div className='flex justify-between items-center'>
                        <span className='text-xl text-white'>
                            Tổng tiền thanh toán:
                        </span>
                        <span className='text-2xl text-blue-400'>
                            {formatPrice(finalPrice)}
                        </span>
                    </div>
                </div>

                {(priceInfo.hasDiscount || appliedCoupon) && (
                    <div className='text-xs text-gray-400'>
                        {appliedCoupon
                            ? `Tiết kiệm ${formatPrice(courseDiscountAmount + couponDiscountAmount)} so với giá gốc.`
                            : `Tiết kiệm ${priceInfo.discountPercentage}% so với giá gốc.`}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
