import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import {
    PlayCircle,
    BookOpen,
    Clock,
    Download,
    Globe,
    Award,
    Share2,
} from 'lucide-react'
import { formatPrice, getCoursePrice } from '../../lib/courseUtils'
import { EnrollmentButton } from '../Enrollments'
import type { Course, PublicCourse } from '../../lib/api/types'

interface CourseSidebarProps {
    course: {
        id?: number
        title: string
        thumbnailUrl?: string | null
        videoPreviewUrl?: string | null
        price: number
        discountPrice?: number
    }
    isEnrolled?: boolean
    enrollmentProgress?: number
    onVideoPreviewClick?: () => void
    isPreview?: boolean
    checkoutUrl?: string
    learnUrl?: string
    useEnrollmentButton?: boolean
    publicCourse?: PublicCourse
}

export function CourseSidebar({
    course,
    isEnrolled = false,
    enrollmentProgress = 0,
    onVideoPreviewClick,
    isPreview = false,
    checkoutUrl,
    learnUrl,
    useEnrollmentButton = false,
    publicCourse,
}: CourseSidebarProps) {
    const priceInfo = getCoursePrice(course)

    return (
        <div className='lg:col-span-1 lg:row-span-2'>
            <Card className='sticky top-20 bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 overflow-hidden self-start shadow-2xl hover:shadow-3xl hover:border-[#3D3D3D]/50 transition-all duration-300 rounded-2xl'>
                {/* Thumbnail */}
                {course.thumbnailUrl ? (
                    <div className='relative aspect-video overflow-hidden'>
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className='w-full h-full object-cover transition-transform duration-300 hover:scale-105'
                        />
                        {course.videoPreviewUrl && (
                            <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent group'>
                                <Button
                                    size='lg'
                                    variant='secondary'
                                    className='rounded-full bg-white/90 hover:bg-white text-black shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200'
                                    onClick={onVideoPreviewClick}
                                >
                                    <PlayCircle className='mr-2 h-5 w-5' />
                                    Xem giới thiệu
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='relative aspect-video overflow-hidden bg-gradient-to-br from-[#1F1F1F] to-[#151515] flex items-center justify-center'>
                        {course.videoPreviewUrl ? (
                            <Button
                                size='lg'
                                variant='secondary'
                                className='rounded-full bg-white/90 hover:bg-white text-black shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200'
                                onClick={onVideoPreviewClick}
                            >
                                <PlayCircle className='mr-2 h-5 w-5' />
                                Xem giới thiệu
                            </Button>
                        ) : (
                            <BookOpen className='h-16 w-16 text-gray-600' />
                        )}
                    </div>
                )}

                <CardContent className='p-5 space-y-4'>
                    {/* Price */}
                    <div className='pb-3 border-b border-[#2D2D2D]/50'>
                        {priceInfo.isFree ? (
                            <div className='text-center'>
                                <div className='inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold shadow-md'>
                                    Miễn phí
                                </div>
                            </div>
                        ) : (
                            <div>
                                {priceInfo.hasDiscount ? (
                                    <div className='space-y-1.5'>
                                        <div className='text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                                            {priceInfo.displayPrice}
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <div className='text-sm text-gray-400 line-through'>
                                                {formatPrice(
                                                    priceInfo.originalPrice
                                                )}
                                            </div>
                                            <Badge className='bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs shadow-md'>
                                                Giảm{' '}
                                                {priceInfo.discountPercentage}%
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                                        {priceInfo.displayPrice}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    {isPreview ? (
                        <Button
                            className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            size='lg'
                            disabled
                        >
                            Đăng ký học
                        </Button>
                    ) : useEnrollmentButton && publicCourse ? (
                        <EnrollmentButton
                            course={publicCourse}
                            className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200'
                        />
                    ) : isEnrolled ? (
                        <div className='space-y-3'>
                            <div className='flex justify-between text-sm text-white'>
                                <span>Tiến độ học tập</span>
                                <span className='font-semibold'>
                                    {enrollmentProgress}%
                                </span>
                            </div>
                            <Progress value={enrollmentProgress} />
                            {learnUrl && (
                                <DarkOutlineButton
                                    asChild
                                    className='w-full hover:bg-[#2D2D2D] hover:border-[#3D3D3D] transition-all duration-200 text-sm py-2'
                                    size='lg'
                                >
                                    <Link to={learnUrl}>Tiếp tục học</Link>
                                </DarkOutlineButton>
                            )}
                        </div>
                    ) : (
                        checkoutUrl && (
                            <Button
                                asChild
                                className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200'
                                size='lg'
                            >
                                <Link to={checkoutUrl}>
                                    {priceInfo.isFree
                                        ? 'Đăng ký học'
                                        : 'Mua khóa học'}
                                </Link>
                            </Button>
                        )
                    )}

                    <div className='flex gap-2'>
                        <DarkOutlineButton className='flex-1 hover:bg-[#2D2D2D] hover:border-[#3D3D3D] transition-all duration-200 text-sm py-2'>
                            <Share2 className='h-3.5 w-3.5 mr-1.5' />
                            Chia sẻ
                        </DarkOutlineButton>
                    </div>

                    {/* Course Includes */}
                    <div className='space-y-2 pt-3 border-t border-[#2D2D2D]/50'>
                        <p className='font-semibold text-white text-sm mb-2'>
                            Khóa học bao gồm:
                        </p>
                        <div className='space-y-1.5'>
                            <div className='flex items-center gap-2 text-xs text-gray-300'>
                                <Clock className='h-3.5 w-3.5 text-blue-400 flex-shrink-0' />
                                <span>Video bài giảng</span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-gray-300'>
                                <BookOpen className='h-3.5 w-3.5 text-green-400 flex-shrink-0' />
                                <span>Nội dung chi tiết</span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-gray-300'>
                                <Download className='h-3.5 w-3.5 text-purple-400 flex-shrink-0' />
                                <span>Tài liệu tải về</span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-gray-300'>
                                <Globe className='h-3.5 w-3.5 text-cyan-400 flex-shrink-0' />
                                <span>Truy cập mọi lúc, mọi nơi</span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-gray-300'>
                                <Award className='h-3.5 w-3.5 text-yellow-400 flex-shrink-0' />
                                <span>Chứng chỉ hoàn thành</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
