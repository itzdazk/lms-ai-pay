import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Separator } from '../components/ui/separator'
import {
    ArrowLeft,
    BookOpen,
    Clock,
    Calendar,
    TrendingUp,
    Award,
    PlayCircle,
    CheckCircle2,
    Star,
    User,
    FileText,
} from 'lucide-react'
import { enrollmentsApi } from '../lib/api/enrollments'
import type { EnrollmentWithCourse } from '../lib/api/enrollments'
import { coursesApi } from '../lib/api'
import type { Lesson } from '../lib/api/types'

export function EnrollmentDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [enrollment, setEnrollment] = useState<EnrollmentWithCourse | null>(
        null
    )
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchEnrollmentDetail()
    }, [id])

    const fetchEnrollmentDetail = async () => {
        if (!id) return

        try {
            setIsLoading(true)
            const enrollmentId = parseInt(id)

            // Fetch enrollment detail
            const enrollmentData = await enrollmentsApi.getEnrollmentById(
                enrollmentId
            )
            setEnrollment(enrollmentData.data)

            // Fetch course lessons
            if (enrollmentData.data.course?.id) {
                const lessonsData = await coursesApi.getCourseLessons(
                    enrollmentData.data.course.id
                )
                setLessons(lessonsData.lessons || [])
            }
        } catch (error: any) {
            console.error('Error fetching enrollment:', error)
            toast.error(
                error?.response?.data?.message ||
                    'Không thể tải thông tin đăng ký'
            )
            navigate('/my-courses')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getStatusConfig = () => {
        if (!enrollment) return null

        switch (enrollment.status) {
            case 'ACTIVE':
                return {
                    badge: 'Đang học',
                    className: 'bg-foreground text-background border-0',
                    description: 'Bạn đang học khóa học này',
                }
            case 'COMPLETED':
                return {
                    badge: 'Hoàn thành',
                    className: 'bg-muted text-foreground border border-border',
                    description: 'Bạn đã hoàn thành khóa học này',
                }
            case 'DROPPED':
                return {
                    badge: 'Đã hủy',
                    className:
                        'bg-muted text-muted-foreground border border-border',
                    description: 'Bạn đã hủy đăng ký khóa học này',
                }
            default:
                return null
        }
    }

    const progressPercentage =
        typeof enrollment?.progressPercentage === 'string'
            ? parseFloat(enrollment.progressPercentage) || 0
            : enrollment?.progressPercentage || 0

    if (isLoading) {
        return (
            <div className='min-h-screen bg-background flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4'></div>
                    <p className='text-muted-foreground'>Đang tải...</p>
                </div>
            </div>
        )
    }

    if (!enrollment) {
        return (
            <div className='min-h-screen bg-background flex items-center justify-center'>
                <div className='text-center'>
                    <h2 className='text-2xl font-bold text-foreground mb-2'>
                        Không tìm thấy đăng ký
                    </h2>
                    <p className='text-muted-foreground mb-4'>
                        Đăng ký bạn đang tìm không tồn tại.
                    </p>
                    <Button onClick={() => navigate('/my-courses')}>
                        Quay lại khóa học của tôi
                    </Button>
                </div>
            </div>
        )
    }

    const { course } = enrollment
    const statusConfig = getStatusConfig()

    return (
        <div className='min-h-screen bg-background'>
            {/* Header */}
            <div className='border-b border-border bg-card'>
                <div className='container mx-auto px-4 py-6'>
                    <Button
                        variant='outline'
                        onClick={() => navigate('/my-courses')}
                        className='mb-4 cursor-pointer'
                    >
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Quay lại
                    </Button>

                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-foreground mb-2'>
                                {course.title}
                            </h1>
                            {statusConfig && (
                                <div className='flex items-center gap-3'>
                                    <Badge className={statusConfig.className}>
                                        {statusConfig.badge}
                                    </Badge>
                                    <span className='text-sm text-muted-foreground'>
                                        {statusConfig.description}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='container mx-auto px-4 py-8'>
                <div className='grid lg:grid-cols-3 gap-8'>
                    {/* Main Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        {/* Progress Overview */}
                        <Card className='bg-card border-border'>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2'>
                                    <TrendingUp className='h-5 w-5' />
                                    Tiến độ học tập
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div>
                                    <div className='flex justify-between items-center mb-2'>
                                        <span className='text-sm text-muted-foreground'>
                                            Tổng tiến độ
                                        </span>
                                        <span className='text-2xl font-bold text-foreground'>
                                            {progressPercentage}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={progressPercentage}
                                        className='h-3 bg-muted'
                                    />
                                </div>

                                <div className='grid grid-cols-2 gap-4 pt-4 border-t border-border'>
                                    <div>
                                        <p className='text-xs text-muted-foreground mb-1'>
                                            Bài học đã hoàn thành
                                        </p>
                                        <p className='text-lg font-semibold text-foreground'>
                                            {Math.round(
                                                (progressPercentage / 100) *
                                                    course.totalLessons
                                            )}{' '}
                                            / {course.totalLessons}
                                        </p>
                                    </div>
                                    <div>
                                        <p className='text-xs text-muted-foreground mb-1'>
                                            Thời gian đã học
                                        </p>
                                        <p className='text-lg font-semibold text-foreground'>
                                            {course.durationHours}h
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enrollment Information */}
                        <Card className='bg-card border-border'>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2'>
                                    <Calendar className='h-5 w-5' />
                                    Thông tin đăng ký
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-xs text-muted-foreground mb-1'>
                                            Ngày đăng ký
                                        </p>
                                        <p className='text-sm font-medium text-foreground'>
                                            {formatDate(enrollment.enrolledAt)}
                                        </p>
                                    </div>
                                    {enrollment.startedAt && (
                                        <div>
                                            <p className='text-xs text-muted-foreground mb-1'>
                                                Ngày bắt đầu
                                            </p>
                                            <p className='text-sm font-medium text-foreground'>
                                                {formatDate(
                                                    enrollment.startedAt
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {enrollment.completedAt && (
                                        <div>
                                            <p className='text-xs text-muted-foreground mb-1'>
                                                Ngày hoàn thành
                                            </p>
                                            <p className='text-sm font-medium text-foreground'>
                                                {formatDate(
                                                    enrollment.completedAt
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {enrollment.lastAccessedAt && (
                                        <div>
                                            <p className='text-xs text-muted-foreground mb-1'>
                                                Truy cập lần cuối
                                            </p>
                                            <p className='text-sm font-medium text-foreground'>
                                                {formatDate(
                                                    enrollment.lastAccessedAt
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Lessons */}
                        {lessons.length > 0 && (
                            <Card className='bg-card border-border'>
                                <CardHeader>
                                    <CardTitle className='flex items-center gap-2'>
                                        <BookOpen className='h-5 w-5' />
                                        Nội dung khóa học ({lessons.length} bài
                                        học)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className='space-y-2'>
                                        {lessons.map((lesson, index) => (
                                            <div
                                                key={lesson.id}
                                                className='flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors'
                                            >
                                                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground'>
                                                    {index + 1}
                                                </div>
                                                <div className='flex-1'>
                                                    <p className='text-sm font-medium text-foreground'>
                                                        {lesson.title}
                                                    </p>
                                                    {lesson.videoDuration && (
                                                        <p className='text-xs text-muted-foreground'>
                                                            {Math.floor(
                                                                lesson.videoDuration /
                                                                    60
                                                            )}
                                                            :
                                                            {String(
                                                                lesson.videoDuration %
                                                                    60
                                                            ).padStart(2, '0')}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    asChild
                                                >
                                                    <Link
                                                        to={`/courses/${course.slug}/lessons?lesson=${lesson.id}`}
                                                    >
                                                        <PlayCircle className='h-4 w-4' />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className='lg:col-span-1'>
                        <div className='sticky top-4 space-y-6'>
                            {/* Course Info Card */}
                            <Card className='bg-card border-border'>
                                <CardContent className='p-6'>
                                    {/* Thumbnail */}
                                    {course.thumbnailUrl && (
                                        <div className='relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-muted'>
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                    )}

                                    {/* Instructor */}
                                    <div className='mb-4'>
                                        <p className='text-xs text-muted-foreground mb-2'>
                                            Giảng viên
                                        </p>
                                        <div className='flex items-center gap-2'>
                                            <Avatar className='h-10 w-10 border-2 border-border'>
                                                <AvatarImage
                                                    src={
                                                        course.instructor
                                                            .avatarUrl
                                                    }
                                                />
                                                <AvatarFallback className='bg-muted text-foreground'>
                                                    <User className='h-5 w-5' />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className='text-sm font-medium text-foreground'>
                                                    {course.instructor.fullName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className='my-4' />

                                    {/* Course Stats */}
                                    <div className='space-y-3'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                <BookOpen className='h-4 w-4 text-muted-foreground' />
                                                <span className='text-sm text-muted-foreground'>
                                                    Bài học
                                                </span>
                                            </div>
                                            <span className='text-sm font-medium text-foreground'>
                                                {course.totalLessons}
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                <Clock className='h-4 w-4 text-muted-foreground' />
                                                <span className='text-sm text-muted-foreground'>
                                                    Thời lượng
                                                </span>
                                            </div>
                                            <span className='text-sm font-medium text-foreground'>
                                                {course.durationHours}h
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                <FileText className='h-4 w-4 text-muted-foreground' />
                                                <span className='text-sm text-muted-foreground'>
                                                    Cấp độ
                                                </span>
                                            </div>
                                            <Badge
                                                variant='outline'
                                                className='border-border'
                                            >
                                                {course.level}
                                            </Badge>
                                        </div>
                                        {course.ratingAvg !== undefined &&
                                            course.ratingAvg > 0 && (
                                                <div className='flex items-center justify-between'>
                                                    <div className='flex items-center gap-2'>
                                                        <Star className='h-4 w-4 text-muted-foreground fill-yellow-400 text-yellow-400' />
                                                        <span className='text-sm text-muted-foreground'>
                                                            Đánh giá
                                                        </span>
                                                    </div>
                                                    <span className='text-sm font-medium text-foreground'>
                                                        {Number(
                                                            course.ratingAvg ||
                                                                0
                                                        ).toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    <Separator className='my-4' />

                                    {/* Action Buttons */}
                                    <div className='space-y-2'>
                                        {enrollment.status === 'COMPLETED' ? (
                                            <>
                                                <Button
                                                    onClick={() =>
                                                        navigate(
                                                            `/certificate/${enrollment.courseId}`
                                                        )
                                                    }
                                                    className='w-full bg-foreground text-background hover:bg-foreground/90'
                                                >
                                                    <Award className='mr-2 h-4 w-4' />
                                                    Xem chứng chỉ
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        navigate(
                                                            `/courses/${course.slug}/lessons`
                                                        )
                                                    }
                                                    variant='outline'
                                                    className='w-full border-border'
                                                >
                                                    <PlayCircle className='mr-2 h-4 w-4' />
                                                    Xem lại khóa học
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    navigate(
                                                        `/courses/${course.slug}/lessons`
                                                    )
                                                }
                                                className='w-full bg-foreground text-background hover:bg-foreground/90'
                                            >
                                                <PlayCircle className='mr-2 h-4 w-4' />
                                                Tiếp tục học
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
