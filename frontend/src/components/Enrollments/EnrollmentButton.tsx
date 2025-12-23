import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { CheckCircle, Loader2, ShoppingCart, BookOpen } from 'lucide-react'
import { enrollmentsApi } from '../../lib/api/enrollments'
import type { PublicCourse } from '../../lib/api/types'
import { getCoursePrice } from '../../lib/courseUtils'

interface EnrollmentButtonProps {
    course: PublicCourse
    onEnrollSuccess?: (enrollment: any) => void
    className?: string
}

export function EnrollmentButton({
    course,
    onEnrollSuccess,
    className,
}: EnrollmentButtonProps) {
    const navigate = useNavigate()
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isEnrolling, setIsEnrolling] = useState(false)

    // Check enrollment status on mount
    useEffect(() => {
        checkEnrollmentStatus()
    }, [course.id])

    const checkEnrollmentStatus = async () => {
        try {
            setIsLoading(true)
            const response = await enrollmentsApi.checkEnrollment(course.id)
            setIsEnrolled(response.data.isEnrolled)
        } catch (error: any) {
            // If 404, user is not enrolled - this is fine
            if (error?.response?.status !== 404) {
                console.error('Failed to check enrollment:', error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleEnroll = async () => {
        const priceInfo = getCoursePrice({
            price: course.price,
            discountPrice: course.discountPrice,
            originalPrice: course.originalPrice ?? course.price,
        })

        // Phase 1: nếu khóa học có phí, chuyển sang trang checkout để test flow "Mua ngay -> checkout"
        if (!priceInfo.isFree) {
            toast.info('Đang chuyển hướng tới trang thanh toán...')
            navigate(`/checkout/${course.slug}`)
            return
        }

        // Free course: dùng API enroll như cũ
        try {
            setIsEnrolling(true)

            const response = await enrollmentsApi.createEnrollment({
                courseId: course.id,
            })

            if (
                response.data.id &&
                response.data.courseId &&
                response.data.userId
            ) {
                toast.success('Đăng ký khóa học thành công!')
                setIsEnrolled(true)

                if (onEnrollSuccess) {
                    onEnrollSuccess(response.data)
                }

                setTimeout(() => {
                    navigate(`/courses/${course.slug}/lessons`)
                }, 1000)
            } else {
                console.error('Unexpected response structure:', response.data)
                toast.error('Phản hồi từ server không đúng định dạng.')
            }
        } catch (error: any) {
            console.error('Enrollment failed:', error)
            toast.error(
                error?.response?.data?.message ||
                    'Không thể đăng ký khóa học. Vui lòng thử lại.'
            )
        } finally {
            setIsEnrolling(false)
        }
    }

    const handleGoToCourse = () => {
        navigate(`/courses/${course.slug}/lessons`)
    }

    if (isLoading) {
        return (
            <Button disabled className={className}>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tải...
            </Button>
        )
    }

    if (isEnrolled) {
        return (
            <Button
                onClick={handleGoToCourse}
                className={className}
                variant='default'
            >
                <BookOpen className='mr-2 h-4 w-4' />
                Vào học ngay
            </Button>
        )
    }

    const priceInfo = getCoursePrice({
        price: course.price,
        discountPrice: course.discountPrice,
        originalPrice: course.originalPrice ?? course.price,
    })
    const isFreeCourse = priceInfo.isFree

    if (isFreeCourse) {
        return (
            <Button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className={className}
                variant='default'
            >
                {isEnrolling ? (
                    <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Đang đăng ký...
                    </>
                ) : (
                    <>
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Đăng ký miễn phí
                    </>
                )}
            </Button>
        )
    }

    return (
        <Button
            onClick={handleEnroll}
            disabled={isEnrolling}
            className={className}
            variant='default'
        >
            {isEnrolling ? (
                <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xử lý...
                </>
            ) : (
                <>
                    <ShoppingCart className='mr-2 h-4 w-4' />
                    Mua ngay - {priceInfo.displayPrice}
                </>
            )}
        </Button>
    )
}
