// ============================================
// FILE: src/pages/CourseDetailPage.tsx
// ĐÃ TÍCH HỢP API - CHỈ THAY ĐỔI NHỮNG GÌ ĐƯỢC YÊU CẦU
// ============================================

import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent } from '../components/ui/dialog'
import {
    Star,
    Users,
    BookOpen,
    Award,
    CheckCircle,
    ArrowLeft,
    X,
} from 'lucide-react'

import {
    LessonsList,
    CourseHeroSection,
    CourseSidebar,
} from '../components/Courses'
import { EnrollmentButton } from '../components/Enrollments'
import { coursesApi } from '../lib/api'
import type { PublicCourse, Lesson, Instructor } from '../lib/api/types'
import { formatDuration } from '../lib/courseUtils'

export function CourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // State quản lý dữ liệu từ API
    const [course, setCourse] = useState<PublicCourse | null>(null)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [instructor, setInstructor] = useState<Instructor | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEnrolled] = useState(false) // TODO: Kết nối với auth context sau
    const [showPreviewVideo, setShowPreviewVideo] = useState(false)

    // Fetch dữ liệu khi component mount hoặc id thay đổi
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return

            try {
                setIsLoading(true)

                const courseId = parseInt(id)

                // Lấy thông tin khóa học
                const courseData = await coursesApi.getPublicCourseById(
                    courseId
                )
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

    return (
        <div className='bg-background'>
            {/* Hero Section */}
            <section className='bg-gradient-to-b from-background via-background to-[#0F0F0F] border-b border-gray-200/10'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-6 pb-10'>
                    <div className='mb-4'>
                        <Button
                            variant='outline'
                            className='border-2 border-[#2D2D2D] !text-white bg-black/50 hover:bg-[#1F1F1F] hover:border-[#3D3D3D] rounded-lg backdrop-blur-sm transition-all duration-200'
                            size='lg'
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Quay lại
                        </Button>
                    </div>
                    <div className='grid lg:grid-cols-3 gap-8 relative'>
                        <CourseHeroSection
                            categoryName={
                                course.category?.name || 'Chưa phân loại'
                            }
                            categoryId={course.categoryId}
                            title={course.title}
                            shortDescription={course.shortDescription}
                            description={course.description}
                            level={course.level || 'BEGINNER'}
                            isFeatured={course.isFeatured}
                            tags={course.tags || []}
                            language={course.language}
                            instructor={instructor}
                            ratingAvg={course.ratingAvg}
                            ratingCount={course.ratingCount}
                            enrolledCount={course.enrolledCount}
                            totalLessons={course.totalLessons}
                            durationHours={course.durationHours}
                        />

                        <CourseSidebar
                            course={{
                                id: course.id,
                                title: course.title,
                                thumbnailUrl: course.thumbnailUrl,
                                videoPreviewUrl: course.videoPreviewUrl,
                                price: course.price,
                                discountPrice: course.discountPrice,
                            }}
                            isEnrolled={isEnrolled}
                            enrollmentProgress={0}
                            onVideoPreviewClick={() =>
                                setShowPreviewVideo(true)
                            }
                            checkoutUrl={`/checkout/${course.id}`}
                            learnUrl={`/learn/${course.id}`}
                            useEnrollmentButton={true}
                            publicCourse={course}
                        />
                        {/* Main Content - Tổng quan, Nội dung, Đánh giá */}
                        <div className='lg:col-span-2'>
                            <Tabs defaultValue='overview' className='w-full'>
                                <TabsList className='w-full justify-start bg-gradient-to-r from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl p-1 shadow-lg'>
                                    <TabsTrigger
                                        value='overview'
                                        className='!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-blue-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2'
                                    >
                                        Tổng quan
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value='curriculum'
                                        className='!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-green-600 data-[state=active]:!to-green-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2'
                                    >
                                        Nội dung
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value='reviews'
                                        className='!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-yellow-600 data-[state=active]:!to-yellow-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2'
                                    >
                                        Đánh giá
                                    </TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent
                                    value='overview'
                                    className='space-y-6 mt-8'
                                >
                                    <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300'>
                                        <CardHeader className='pb-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center'>
                                                    <BookOpen className='h-5 w-5 text-blue-400' />
                                                </div>
                                                <CardTitle className='text-white text-xl'>
                                                    Mô tả khóa học
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className='prose max-w-none prose-invert'>
                                            <div
                                                className='text-gray-300 leading-relaxed'
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        course.description ||
                                                        '',
                                                }}
                                            />
                                        </CardContent>
                                    </Card>

                                    {course.whatYouLearn && (
                                        <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300'>
                                            <CardHeader className='pb-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center'>
                                                        <Award className='h-5 w-5 text-green-400' />
                                                    </div>
                                                    <CardTitle className='text-white text-xl'>
                                                        Bạn sẽ học được gì?
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className='text-gray-300 leading-relaxed'
                                                    dangerouslySetInnerHTML={{
                                                        __html: course.whatYouLearn,
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {course.courseObjectives && (
                                        <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300'>
                                            <CardHeader className='pb-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center'>
                                                        <Star className='h-5 w-5 text-purple-400' />
                                                    </div>
                                                    <CardTitle className='text-white text-xl'>
                                                        Mục tiêu khóa học
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className='text-gray-300 leading-relaxed'
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            course.courseObjectives ||
                                                            '',
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {course.requirements && (
                                        <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-orange-500/30 transition-all duration-300'>
                                            <CardHeader className='pb-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center'>
                                                        <CheckCircle className='h-5 w-5 text-orange-400' />
                                                    </div>
                                                    <CardTitle className='text-white text-xl'>
                                                        Yêu cầu
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className='text-gray-300 leading-relaxed'
                                                    dangerouslySetInnerHTML={{
                                                        __html: course.requirements,
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {course.targetAudience && (
                                        <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300'>
                                            <CardHeader className='pb-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center'>
                                                        <Users className='h-5 w-5 text-cyan-400' />
                                                    </div>
                                                    <CardTitle className='text-white text-xl'>
                                                        Đối tượng mục tiêu
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div
                                                    className='text-gray-300 leading-relaxed'
                                                    dangerouslySetInnerHTML={{
                                                        __html: course.targetAudience,
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                {/* Curriculum Tab */}
                                <TabsContent
                                    value='curriculum'
                                    className='mt-8'
                                >
                                    <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg'>
                                        <CardHeader className='pb-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center'>
                                                    <BookOpen className='h-5 w-5 text-green-400' />
                                                </div>
                                                <div>
                                                    <CardTitle className='text-white text-xl'>
                                                        Nội dung khóa học
                                                    </CardTitle>
                                                    <CardDescription className='text-gray-400 mt-1'>
                                                        {lessons.length} bài học
                                                        •{' '}
                                                        {formatDuration(
                                                            course.durationHours
                                                        )}
                                                    </CardDescription>
                                                </div>
                                            </div>
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

                                {/* Reviews Tab */}
                                <TabsContent value='reviews' className='mt-8'>
                                    <Card className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg'>
                                        <CardHeader className='pb-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center'>
                                                    <Star className='h-5 w-5 text-yellow-400' />
                                                </div>
                                                <CardTitle className='text-white text-xl'>
                                                    Đánh giá của học viên
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Giữ nguyên phần mock reviews như cũ */}
                                            <div className='flex items-center gap-8 mb-8 p-6 bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-lg'>
                                                <div className='text-center'>
                                                    <div className='text-5xl mb-2 text-white font-bold'>
                                                        {Number(
                                                            course.ratingAvg ||
                                                                0
                                                        ).toFixed(1)}
                                                    </div>
                                                    <div className='flex gap-1 mb-2 justify-center'>
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
                                                        {course.ratingCount ||
                                                            0}{' '}
                                                        đánh giá
                                                    </p>
                                                </div>
                                                <div className='flex-1 space-y-2'>
                                                    {[5, 4, 3, 2, 1].map(
                                                        (star) => (
                                                            <div
                                                                key={star}
                                                                className='flex items-center gap-2'
                                                            >
                                                                <span className='text-sm w-12 text-gray-300'>
                                                                    {star} sao
                                                                </span>
                                                                <Progress
                                                                    value={
                                                                        star ===
                                                                        5
                                                                            ? 80
                                                                            : star ===
                                                                              4
                                                                            ? 15
                                                                            : 5
                                                                    }
                                                                    className='flex-1'
                                                                />
                                                                <span className='text-sm text-gray-400 w-12 text-right'>
                                                                    {star === 5
                                                                        ? '80%'
                                                                        : star ===
                                                                          4
                                                                        ? '15%'
                                                                        : '5%'}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            {/* ... mock reviews giữ nguyên ... */}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </section>

            {/* Preview Video Dialog */}
            <Dialog open={showPreviewVideo} onOpenChange={setShowPreviewVideo}>
                <DialogContent className='!max-w-[60vw] !w-[60vw] !max-h-[85vh] sm:!max-w-[60vw] bg-[#1A1A1A] border-[#2D2D2D] text-white p-0'>
                    {course?.videoPreviewUrl && (
                        <div className='relative w-full aspect-video bg-black'>
                            <button
                                onClick={() => setShowPreviewVideo(false)}
                                className='absolute top-4 right-4 z-50 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors'
                                aria-label='Đóng'
                            >
                                <X className='h-5 w-5' />
                            </button>
                            <video
                                src={course.videoPreviewUrl}
                                controls
                                autoPlay
                                className='w-full h-full object-contain'
                                controlsList='nodownload'
                            >
                                Trình duyệt của bạn không hỗ trợ video.
                            </video>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
