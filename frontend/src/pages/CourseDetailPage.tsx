// ============================================
// FILE: src/pages/CourseDetailPage.tsx
// ĐÃ TÍCH HỢP API - CHỈ THAY ĐỔI NHỮNG GÌ ĐƯỢC YÊU CẦU
// ============================================

import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { DarkOutlineButton } from '../components/ui/buttons'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../components/ui/accordion'
import { Progress } from '../components/ui/progress'
import {
    Star,
    Users,
    BookOpen,
    Clock,
    Award,
    PlayCircle,
    CheckCircle,
    Lock,
    Globe,
    Download,
    Share2,
    ArrowLeft,
} from 'lucide-react'

// THÊM: Các component và API mới
import { LessonsList, InstructorInfo } from '../components/Courses'
import { coursesApi } from '../lib/api'
import type { Course, Instructor, Lesson } from '../lib/api/types'
import {
    formatDuration,
    getCoursePrice,
    getCourseLevelBadge,
} from '../lib/courseUtils'

export function CourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // State quản lý dữ liệu từ API
    const [course, setCourse] = useState<Course | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [instructor, setInstructor] = useState<Instructor | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEnrolled, setIsEnrolled] = useState(false) // TODO: Kết nối với auth context sau

    // Fetch dữ liệu khi component mount hoặc id thay đổi
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return

            try {
                setIsLoading(true)

                const courseId = parseInt(id)

                // Lấy thông tin khóa học
                const courseData = await coursesApi.getCourseById(courseId)
                setCourse(courseData)

                // Tăng lượt xem (fire and forget)
                coursesApi.incrementViewCount(courseId).catch(() => {})

                // Lấy danh sách bài học
                const lessonsData = await coursesApi.getCourseLessons(courseId)
                setLessons(lessonsData.lessons || [])

                // Lấy thông tin giảng viên
                const instructorData = await coursesApi.getCourseInstructor(
                    courseId
                )
                setInstructor(instructorData)
            } catch (error: any) {
                console.error('Error fetching course:', error)
                toast.error(
                    error?.response?.data?.message ||
                        'Không thể tải thông tin khóa học'
                )
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseData()
    }, [id])

    // Loading state
    if (isLoading) {
        return (
            <div className='container mx-auto px-4 py-20 text-center bg-background min-h-screen'>
                <div className='animate-pulse space-y-4'>
                    <div className='h-8 bg-[#2D2D2D] rounded w-1/3 mx-auto' />
                    <div className='h-4 bg-[#2D2D2D] rounded w-1/4 mx-auto' />
                </div>
            </div>
        )
    }

    // Không tìm thấy khóa học
    if (!course) {
        return (
            <div className='container mx-auto px-4 py-20 text-center bg-background min-h-screen'>
                <h1 className='text-3xl mb-4 text-foreground'>
                    Không tìm thấy khóa học
                </h1>
                <Button
                    asChild
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                    <Link to='/courses'>Quay lại danh sách khóa học</Link>
                </Button>
            </div>
        )
    }

    // Helper
    const levelBadge = getCourseLevelBadge(course.level)
    const priceInfo = getCoursePrice(course)

    return (
        <div className='bg-background'>
            {/* Hero Section */}
            <section className='bg-background border-b border-gray-200'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-2 pb-7'>
                    <div className='mb-3'>
                        <Button
                            variant='outline'
                            className='border-2 border-[#2D2D2D] !text-white bg-black hover:bg-[#1F1F1F] rounded-lg'
                            size='lg'
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Quay lại
                        </Button>
                    </div>
                    <div className='grid lg:grid-cols-3 gap-8'>
                        <div className='lg:col-span-2 bg-[#1A1A1A] border-2 border-[#2D2D2D] rounded-xl p-6 overflow-hidden'>
                            {/* Breadcrumb */}
                            <div className='flex items-center gap-2 text-sm text-gray-400 mb-4'>
                                <Link
                                    to='/courses'
                                    className='hover:text-white transition-colors'
                                >
                                    Khóa học
                                </Link>
                                <span>/</span>
                                <Link
                                    to={`/courses?categoryId=${course.categoryId}`}
                                    className='hover:text-white transition-colors'
                                >
                                    {course.category?.name || 'Chưa phân loại'}
                                </Link>
                            </div>

                            {/* Title & Badges */}
                            <div className='mb-6'>
                                <div className='flex flex-wrap gap-2 mb-3'>
                                    <Badge className={levelBadge.className}>
                                        {levelBadge.label}
                                    </Badge>
                                    {course.isFeatured && (
                                        <Badge className='bg-yellow-500 text-white'>
                                            Nổi bật
                                        </Badge>
                                    )}
                                    <Badge
                                        variant='outline'
                                        className='text-white border-[#2D2D2D]'
                                    >
                                        {course.category?.name || 'Khác'}
                                    </Badge>
                                </div>
                                <h1 className='text-3xl md:text-4xl mb-3 text-white font-bold leading-tight'>
                                    {course.title}
                                </h1>
                                <p className='text-base text-gray-300 leading-relaxed'>
                                    {course.shortDescription ||
                                        course.description}
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                                <div className='bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                                        <span className='text-lg font-bold text-white'>
                                            {Number(
                                                course.ratingAvg || 0
                                            ).toFixed(1)}
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        {course.ratingCount || 0} đánh giá
                                    </p>
                                </div>
                                <div className='bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Users className='h-4 w-4 text-gray-400' />
                                        <span className='text-lg font-bold text-white'>
                                            {(
                                                course.enrolledCount || 0
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Học viên
                                    </p>
                                </div>
                                <div className='bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <BookOpen className='h-4 w-4 text-gray-400' />
                                        <span className='text-lg font-bold text-white'>
                                            {course.totalLessons || 0}
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Bài học
                                    </p>
                                </div>
                                <div className='bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Clock className='h-4 w-4 text-gray-400' />
                                        <span className='text-lg font-bold text-white'>
                                            {course.durationHours
                                                ? formatDuration(
                                                      course.durationHours
                                                  ).split(' ')[0]
                                                : '0'}{' '}
                                            giờ
                                        </span>
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Thời lượng
                                    </p>
                                </div>
                            </div>

                            {/* Instructor */}
                            <div className='flex items-center gap-3 p-3 bg-[#1A1A1A1A] border border-[#2D2D2D] rounded-lg'>
                                <Avatar className='h-10 w-10'>
                                    <AvatarImage
                                        src={course.instructor?.avatarUrl}
                                    />
                                    <AvatarFallback className='bg-blue-600 text-white'>
                                        {course.instructor?.fullName?.[0] ||
                                            'I'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className='text-xs text-gray-400 mb-0.5'>
                                        Giảng viên
                                    </p>
                                    <p className='text-sm font-semibold text-white'>
                                        {course.instructor?.fullName ||
                                            'Đang cập nhật'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Card */}
                        <div className='lg:col-span-1'>
                            <Card className='sticky top-20 bg-[#1A1A1A] border-[#2D2D2D] overflow-hidden'>
                                <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                                    <img
                                        src={
                                            course.thumbnailUrl ||
                                            'https://via.placeholder.com/400x225'
                                        }
                                        alt={course.title}
                                        className='w-full h-full object-cover'
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                                        <Button
                                            size='lg'
                                            variant='secondary'
                                            className='rounded-full'
                                        >
                                            <PlayCircle className='mr-2 h-5 w-5' />
                                            Xem giới thiệu
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className='p-6 space-y-4'>
                                    {/* Giá khóa học */}
                                    {priceInfo.isFree ? (
                                        <div className='text-3xl font-bold text-green-600'>
                                            Miễn phí
                                        </div>
                                    ) : (
                                        <div>
                                            <div className='text-3xl font-bold text-blue-600 mb-1'>
                                                {priceInfo.displayPrice}
                                            </div>
                                            {priceInfo.hasDiscount && (
                                                <>
                                                    <div className='text-lg text-gray-400 line-through'>
                                                        {
                                                            priceInfo.originalPrice
                                                        }
                                                    </div>
                                                    <Badge className='bg-red-500 mt-2'>
                                                        Giảm{' '}
                                                        {
                                                            priceInfo.discountPercentage
                                                        }
                                                        %
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Nút hành động */}
                                    {isEnrolled ? (
                                        <div className='space-y-3'>
                                            <div className='flex justify-between text-sm text-white'>
                                                <span>Tiến độ học tập</span>
                                                <span className='font-semibold'>
                                                    0%
                                                </span>
                                            </div>
                                            <Progress value={0} />
                                            <DarkOutlineButton
                                                asChild
                                                className='w-full'
                                                size='lg'
                                            >
                                                <Link
                                                    to={`/learn/${course.id}`}
                                                >
                                                    Tiếp tục học
                                                </Link>
                                            </DarkOutlineButton>
                                        </div>
                                    ) : (
                                        <Button
                                            asChild
                                            className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                                            size='lg'
                                        >
                                            <Link to={`/checkout/${course.id}`}>
                                                {priceInfo.isFree
                                                    ? 'Đăng ký học'
                                                    : 'Mua khóa học'}
                                            </Link>
                                        </Button>
                                    )}

                                    <div className='flex gap-2'>
                                        <DarkOutlineButton className='flex-1'>
                                            <Share2 className='h-4 w-4 mr-2' />
                                            Chia sẻ
                                        </DarkOutlineButton>
                                    </div>

                                    {/* Khóa học bao gồm */}
                                    <div className='space-y-3 pt-4 border-t border-[#2D2D2D]'>
                                        <p className='font-semibold text-white'>
                                            Khóa học bao gồm:
                                        </p>
                                        <div className='space-y-2 text-sm'>
                                            <div className='flex items-center gap-2'>
                                                <Clock className='h-4 w-4 text-blue-600' />
                                                <span className='text-white'>
                                                    {formatDuration(
                                                        course.durationHours
                                                    )}{' '}
                                                    video
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <BookOpen className='h-4 w-4 text-blue-600' />
                                                <span className='text-white'>
                                                    {course.totalLessons} bài
                                                    học
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Download className='h-4 w-4 text-blue-600' />
                                                <span className='text-white'>
                                                    Tài liệu tải về
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Globe className='h-4 w-4 text-blue-600' />
                                                <span className='text-white'>
                                                    Truy cập mọi lúc, mọi nơi
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Award className='h-4 w-4 text-blue-600' />
                                                <span className='text-white'>
                                                    Chứng chỉ hoàn thành
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className='container mx-auto px-4 md:px-6 lg:px-8 py-7 bg-background'>
                <div className='grid lg:grid-cols-3 gap-8'>
                    <div className='lg:col-span-2'>
                        <Tabs defaultValue='overview' className='w-full'>
                            <TabsList className='w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D]'>
                                <TabsTrigger
                                    value='overview'
                                    className='!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]'
                                >
                                    Tổng quan
                                </TabsTrigger>
                                <TabsTrigger
                                    value='curriculum'
                                    className='!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]'
                                >
                                    Nội dung
                                </TabsTrigger>
                                <TabsTrigger
                                    value='reviews'
                                    className='!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]'
                                >
                                    Đánh giá
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent
                                value='overview'
                                className='space-y-4 mt-6'
                            >
                                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <CardHeader>
                                        <CardTitle className='text-white'>
                                            Mô tả khóa học
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className='prose max-w-none'>
                                        <div
                                            className='text-gray-300 prose prose-invert'
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    course.description || '',
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Bạn sẽ học được gì */}
                                {course.whatYouLearn && (
                                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                        <CardHeader>
                                            <CardTitle className='text-white'>
                                                Bạn sẽ học được gì?
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className='prose prose-invert text-gray-300'
                                                dangerouslySetInnerHTML={{
                                                    __html: course.whatYouLearn,
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Yêu cầu */}
                                {course.requirements && (
                                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                        <CardHeader>
                                            <CardTitle className='text-white'>
                                                Yêu cầu
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className='prose prose-invert text-gray-300'
                                                dangerouslySetInnerHTML={{
                                                    __html: course.requirements,
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Curriculum Tab */}
                            <TabsContent value='curriculum' className='mt-6'>
                                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <CardHeader>
                                        <CardTitle className='text-white'>
                                            Nội dung khóa học
                                        </CardTitle>
                                        <CardDescription className='text-gray-400'>
                                            {lessons.length} bài học •{' '}
                                            {formatDuration(
                                                course.durationHours
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <LessonsList
                                            lessons={lessons}
                                            isEnrolled={isEnrolled}
                                            totalDuration={
                                                course.durationHours * 60
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Reviews Tab - tạm giữ mock */}
                            <TabsContent value='reviews' className='mt-6'>
                                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <CardHeader>
                                        <CardTitle className='text-white'>
                                            Đánh giá của học viên
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Giữ nguyên phần mock reviews như cũ */}
                                        <div className='flex items-center gap-8 mb-8 p-6 bg-[#1F1F1F] rounded-lg'>
                                            <div className='text-center'>
                                                <div className='text-5xl mb-2'>
                                                    {Number(
                                                        course.ratingAvg || 0
                                                    ).toFixed(1)}
                                                </div>
                                                <div className='flex gap-1 mb-2'>
                                                    {[...Array(5)].map(
                                                        (_, i) => (
                                                            <Star
                                                                key={i}
                                                                className='h-5 w-5 fill-yellow-400 text-yellow-400'
                                                            />
                                                        )
                                                    )}
                                                </div>
                                                <p className='text-sm text-gray-400'>
                                                    {course.ratingCount || 0}{' '}
                                                    đánh giá
                                                </p>
                                            </div>
                                            <div className='flex-1 space-y-2'>
                                                {[5, 4, 3, 2, 1].map((star) => (
                                                    <div
                                                        key={star}
                                                        className='flex items-center gap-2'
                                                    >
                                                        <span className='text-sm w-12 text-gray-300'>
                                                            {star} sao
                                                        </span>
                                                        <Progress
                                                            value={
                                                                star === 5
                                                                    ? 80
                                                                    : star === 4
                                                                    ? 15
                                                                    : 5
                                                            }
                                                            className='flex-1'
                                                        />
                                                        <span className='text-sm text-gray-400 w-12 text-right'>
                                                            {star === 5
                                                                ? '80%'
                                                                : star === 4
                                                                ? '15%'
                                                                : '5%'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* ... mock reviews giữ nguyên ... */}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Sidebar - Thông tin giảng viên */}
                    <div className='lg:col-span-1'>
                        {instructor && (
                            <InstructorInfo instructor={instructor} />
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
