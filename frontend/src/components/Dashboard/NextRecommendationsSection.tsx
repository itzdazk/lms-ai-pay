import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { DarkOutlineButton } from '../ui/buttons'
import { Badge } from '../ui/badge'
import { Loader2, BookOpen, Star, ArrowRight } from 'lucide-react'
import { coursesApi } from '../../lib/api/courses'
import type { Course } from '../../lib/api/types'

interface NextRecommendationsSectionProps {
    enrolledCourses?: Array<{
        courseId?: number
        course?: {
            id?: number
            categoryId?: number
            category?: { id: number }
            tags?: Array<{ id: number }>
            level?: string
        }
    }>
}

export function NextRecommendationsSection({
    enrolledCourses = [],
}: NextRecommendationsSectionProps) {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchRelatedCourses = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get enrolled course IDs to exclude
                const enrolledCourseIds = new Set(
                    enrolledCourses
                        .map((e) => e.courseId || e.course?.id)
                        .filter((id): id is number => id !== undefined)
                )

                // If no enrolled courses, show featured courses
                if (enrolledCourseIds.size === 0) {
                    const featuredCourses = await coursesApi.getFeaturedCourses(
                        4
                    )
                    if (featuredCourses && featuredCourses.length > 0) {
                        setCourses(featuredCourses)
                    } else {
                        const popularCourses = await coursesApi.getCourses({
                            limit: 4,
                            sortBy: 'popular',
                        })
                        setCourses(popularCourses?.data || [])
                    }
                    setLoading(false)
                    return
                }

                // Collect categories from enrolled courses
                const categoryIds = new Set<number>()

                enrolledCourses.forEach((enrollment) => {
                    const course = enrollment.course
                    if (course) {
                        if (course.categoryId) {
                            categoryIds.add(course.categoryId)
                        }
                        if (course.category?.id) {
                            categoryIds.add(course.category.id)
                        }
                    }
                })

                // Find related courses by category
                let relatedCourses: Course[] = []
                const limit = 8 // Fetch more to filter out enrolled ones

                if (categoryIds.size > 0) {
                    // Get courses from same categories
                    const categoryArray = Array.from(categoryIds)
                    for (const categoryId of categoryArray) {
                        const categoryCourses = await coursesApi.getCourses({
                            categoryId,
                            limit,
                            sortBy: 'popular',
                        })
                        if (categoryCourses?.data) {
                            relatedCourses.push(...categoryCourses.data)
                        }
                    }
                }

                // Filter out enrolled courses and get unique courses
                const uniqueCourses = relatedCourses
                    .filter((course) => !enrolledCourseIds.has(course.id))
                    .filter(
                        (course, index, self) =>
                            index === self.findIndex((c) => c.id === course.id)
                    )
                    .slice(0, 4)

                if (uniqueCourses.length >= 4) {
                    setCourses(uniqueCourses)
                } else {
                    // Fill remaining slots with popular courses
                    const popularCourses = await coursesApi.getCourses({
                        limit: 4 - uniqueCourses.length + 4,
                        sortBy: 'popular',
                    })
                    const additionalCourses =
                        popularCourses?.data
                            .filter(
                                (course) => !enrolledCourseIds.has(course.id)
                            )
                            .filter(
                                (course) =>
                                    !uniqueCourses.some(
                                        (uc) => uc.id === course.id
                                    )
                            )
                            .slice(0, 4 - uniqueCourses.length) || []

                    setCourses([...uniqueCourses, ...additionalCourses])
                }
            } catch (err: any) {
                console.error('Error fetching related courses:', err)
                // Fallback to featured courses on error
                try {
                    const featuredCourses = await coursesApi.getFeaturedCourses(
                        4
                    )
                    if (featuredCourses && featuredCourses.length > 0) {
                        setCourses(featuredCourses)
                    } else {
                        setError('Không thể tải khóa học liên quan.')
                    }
                } catch (fallbackErr: any) {
                    setError('Không thể tải khóa học liên quan.')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchRelatedCourses()
    }, [enrolledCourses])

    if (loading) {
        return (
            <div className='mb-8'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-2xl font-bold text-black dark:text-white'>
                        Khóa học liên quan
                    </h2>
                </div>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-blue-400' />
                            Khóa học liên quan
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Những khóa học phù hợp với các khóa học bạn đang học
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-5 w-5 animate-spin text-blue-500' />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className='mb-8'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-2xl font-bold text-black dark:text-white'>
                        Khóa học liên quan
                    </h2>
                </div>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-blue-400' />
                            Khóa học liên quan
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Những khóa học phù hợp với các khóa học bạn đang học
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className='text-red-400 text-sm'>{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (courses.length === 0) {
        return (
            <div className='mb-8'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-2xl font-bold text-black dark:text-white'>
                        Khóa học liên quan
                    </h2>
                </div>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-blue-400' />
                            Khóa học liên quan
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Những khóa học phù hợp với các khóa học bạn đang học
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className='text-gray-400 text-sm text-center py-4'>
                            Chưa có khóa học liên quan. Hãy đăng ký một số khóa
                            học để xem các khóa học tương tự!
                        </p>
                        <div className='pt-2'>
                            <DarkOutlineButton asChild className='w-full'>
                                <Link to='/courses'>
                                    Khám phá khóa học
                                    <ArrowRight className='ml-2 h-4 w-4' />
                                </Link>
                            </DarkOutlineButton>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-bold text-black dark:text-white'>
                    Khóa học liên quan
                </h2>
            </div>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <BookOpen className='h-4 w-4 text-blue-400' />
                        Gợi ý cho bạn
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Những khóa học phù hợp với các khóa học bạn đang học
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                    {courses.map((course) => (
                        <RecommendedCourseItem
                            key={course.id}
                            course={course}
                        />
                    ))}
                    <div className='pt-2'>
                        <DarkOutlineButton asChild className='w-full'>
                            <Link to='/courses'>
                                Xem tất cả khóa học
                                <ArrowRight className='ml-2 h-4 w-4' />
                            </Link>
                        </DarkOutlineButton>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function RecommendedCourseItem({ course }: { course: Course }) {
    const price = course.discountPrice
        ? Number(course.discountPrice)
        : Number(course.price)

    return (
        <Link
            to={`/courses/${course.slug}`}
            className='block rounded-lg border border-[#2D2D2D] bg-black/40 p-3 hover:border-blue-500/50 hover:bg-black/60 transition-all group'
        >
            <div className='flex gap-3'>
                {course.thumbnailUrl ? (
                    <div className='relative w-20 h-14 shrink-0 rounded overflow-hidden'>
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className='w-full h-full object-cover'
                        />
                    </div>
                ) : (
                    <div className='w-20 h-14 shrink-0 rounded bg-[#2D2D2D] flex items-center justify-center'>
                        <BookOpen className='h-6 w-6 text-gray-500' />
                    </div>
                )}
                <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-1'>
                        <h3 className='text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors'>
                            {course.title}
                        </h3>
                    </div>
                    <div className='flex items-center gap-2 mb-2'>
                        {course.ratingAvg && Number(course.ratingAvg) > 0 && (
                            <div className='flex items-center gap-1'>
                                <Star className='h-3 w-3 text-yellow-400 fill-yellow-400' />
                                <span className='text-xs text-white'>
                                    {Number(course.ratingAvg).toFixed(1)}
                                </span>
                            </div>
                        )}
                        {course.enrolledCount && (
                            <span className='text-xs text-gray-400'>
                                {course.enrolledCount} học viên
                            </span>
                        )}
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-white'>
                            {price === 0
                                ? 'Miễn phí'
                                : `${price.toLocaleString('vi-VN')}đ`}
                        </span>
                        {course.discountPrice && (
                            <Badge className='bg-green-500/20 text-green-400 border-green-500/30 text-xs'>
                                Giảm giá
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
