import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { CheckCircle, Loader2, ShoppingCart, BookOpen } from 'lucide-react'
import { enrollmentsApi } from '../../lib/api/enrollments'
import type { PublicCourse } from '../../lib/api/types'

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
        try {
            setIsEnrolling(true)

            const response = await enrollmentsApi.createEnrollment({
                courseId: course.id,
            })

            // Free course: response.data is the enrollment object directly
            // Paid course: response.data is the order object (may have redirectUrl)

            // Check if it's a paid course (has redirectUrl in order)
            if (response.data.redirectUrl) {
                // Paid course - redirect to payment
                toast.info('Đang chuyển hướng đến trang thanh toán...')
                window.location.href = response.data.redirectUrl
                return
            }

            // Check if it's an enrollment object (has id, courseId, userId)
            if (
                response.data.id &&
                response.data.courseId &&
                response.data.userId
            ) {
                // Free course - enrolled successfully
                toast.success('Đăng ký khóa học thành công!')
                setIsEnrolled(true)

                if (onEnrollSuccess) {
                    onEnrollSuccess(response.data)
                }

                // Navigate to course learning page
                setTimeout(() => {
                    navigate(`/learn/${course.id}`)
                }, 1000)
            } else {
                // Unexpected response structure
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
        navigate(`/learn/${course.id}`)
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

    const isFreeCourse = (course: PublicCourse) =>
        Number(course.discountPrice ?? course.price) === 0

    if (isFreeCourse(course)) {
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
                    Mua ngay -{' '}
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                    }).format(course.price)}
                </>
            )}
        </Button>
    )
}
