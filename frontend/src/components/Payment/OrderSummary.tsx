import { BookOpen, Clock, Sparkles } from 'lucide-react'
import type { Course, PublicCourse } from '../../lib/api/types'
import {
    formatDuration,
    formatPrice,
    getCoursePrice,
} from '../../lib/courseUtils'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Skeleton } from '../ui/skeleton'

type OrderSummaryProps = {
    course?: PublicCourse | Course | null
    loading?: boolean
    className?: string
}

export function OrderSummary({
    course,
    loading,
    className,
}: OrderSummaryProps) {
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

    if (!course) {
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

    const priceInfo = getCoursePrice({
        price: course.price ?? course.originalPrice,
        discountPrice: course.discountPrice,
        originalPrice: course.originalPrice ?? course.price,
    })

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
                    {course.instructor?.fullName && (
                        <p className='text-sm text-gray-400 mb-3'>
                            {course.instructor.fullName}
                        </p>
                    )}

                    <div className='space-y-2 text-sm text-gray-400'>
                        <div className='flex items-center gap-2'>
                            <BookOpen className='h-4 w-4' />
                            <span>{lessonsCount || 0} bài học</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4' />
                            <span>{formatDuration(durationHours)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Sparkles className='h-4 w-4' />
                            <span>Chứng chỉ hoàn thành</span>
                        </div>
                    </div>
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
                            <span>Giảm giá:</span>
                            <span>
                                -
                                {formatPrice(
                                    priceInfo.originalPrice -
                                        priceInfo.currentPrice
                                )}
                            </span>
                        </div>
                    )}
                    <Separator className='bg-[#2D2D2D]' />
                    <div className='flex justify-between items-center'>
                        <span className='text-xl text-white'>Tổng cộng:</span>
                        <span className='text-2xl text-blue-400'>
                            {priceInfo.displayPrice}
                        </span>
                    </div>
                </div>

                {priceInfo.hasDiscount && (
                    <div className='text-xs text-gray-400'>
                        Tiết kiệm {priceInfo.discountPercentage}% so với giá
                        gốc.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
