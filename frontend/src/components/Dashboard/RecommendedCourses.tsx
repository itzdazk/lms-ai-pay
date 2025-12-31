import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { DarkOutlineButton } from '../ui/buttons'
import { Badge } from '../ui/badge'
import { Loader2, Sparkles, Star } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'
import type { Course } from '../../lib/api/types'

export function RecommendedCourses() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudentRecommendations(6)
                setCourses(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load recommendations')
            } finally {
                setLoading(false)
            }
        }

        fetchRecommendations()
    }, [])

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Sparkles className='h-5 w-5 text-blue-400' />
                        Khóa học đề xuất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Sparkles className='h-5 w-5 text-blue-400' />
                        Khóa học đề xuất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (courses.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Sparkles className='h-5 w-5 text-blue-400' />
                        Khóa học đề xuất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-gray-400 text-sm'>
                        Chưa có khóa học đề xuất. Hãy đăng ký một số khóa học để
                        nhận gợi ý!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Sparkles className='h-5 w-5 text-blue-400' />
                    Khóa học đề xuất
                </CardTitle>
                <CardDescription className='text-gray-400'>
                    Được đề xuất dựa trên sở thích và lịch sử học tập của bạn
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {courses.map((course) => (
                        <RecommendedCourseCard
                            key={course.id}
                            course={course}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function RecommendedCourseCard({ course }: { course: Course }) {
    const price = course.discountPrice
        ? Number(course.discountPrice)
        : Number(course.price)
    const originalPrice = course.discountPrice ? Number(course.price) : null

    return (
        <div className='rounded-lg border border-[#2D2D2D] bg-black/40 overflow-hidden hover:border-white/30 transition-colors'>
            {course.thumbnailUrl && (
                <Link to={`/courses/${course.slug}`}>
                    <div className='relative aspect-video overflow-hidden'>
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className='w-full h-full object-cover'
                        />
                        <div className='absolute top-2 right-2'>
                            <Badge className='bg-blue-500/20 text-blue-400 border-blue-500/30'>
                                <Sparkles className='h-3 w-3 mr-1' />
                                Đề xuất
                            </Badge>
                        </div>
                    </div>
                </Link>
            )}
            <div className='p-4'>
                <Link to={`/courses/${course.slug}`}>
                    <h3 className='text-white font-semibold line-clamp-2 mb-2 hover:text-blue-400 transition-colors'>
                        {course.title}
                    </h3>
                </Link>
                {course.description && (
                    <p className='text-sm text-gray-400 line-clamp-2 mb-3'>
                        {course.description}
                    </p>
                )}
                <div className='flex items-center gap-2 mb-3'>
                    {course.ratingAvg && Number(course.ratingAvg) > 0 && (
                        <div className='flex items-center gap-1'>
                            <Star className='h-4 w-4 text-yellow-400 fill-yellow-400' />
                            <span className='text-sm text-white'>
                                {Number(course.ratingAvg).toFixed(1)}
                            </span>
                            {course.ratingCount && (
                                <span className='text-xs text-gray-400'>
                                    ({course.ratingCount})
                                </span>
                            )}
                        </div>
                    )}
                    {course.enrolledCount && (
                        <span className='text-xs text-gray-400'>
                            {course.enrolledCount} học viên
                        </span>
                    )}
                </div>
                <div className='flex items-center justify-between'>
                    <div>
                        {originalPrice && (
                            <span className='text-xs text-gray-500 line-through mr-2'>
                                {originalPrice.toLocaleString('vi-VN')}đ
                            </span>
                        )}
                        <span className='text-white font-semibold'>
                            {price === 0
                                ? 'Miễn phí'
                                : `${price.toLocaleString('vi-VN')}đ`}
                        </span>
                    </div>
                    <DarkOutlineButton asChild size='sm'>
                        <Link to={`/courses/${course.slug}`}>Xem khóa học</Link>
                    </DarkOutlineButton>
                </div>
            </div>
        </div>
    )
}
