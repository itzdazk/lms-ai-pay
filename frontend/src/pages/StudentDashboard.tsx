import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import {
    BookOpen,
    Clock,
    Award,
    TrendingUp,
    PlayCircle,
    CheckCircle,
    Flame,
    Calendar,
    BookmarkCheck,
    Compass,
    Target,
    Loader2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { useEnrolledCourses } from '../hooks/useEnrolledCourses'
import { useContinueWatching } from '../hooks/useContinueWatching'
import { useStudyTime } from '../hooks/useStudyTime'
import { useLearningStreak } from '../hooks/useLearningStreak'
import { RecentActivities } from '../components/Dashboard/RecentActivities'
import { QuizPerformanceSummary } from '../components/Dashboard/QuizPerformanceSummary'
import { StudyTimeChart } from '../components/Dashboard/StudyTimeChart'
import { RecommendedCourses } from '../components/Dashboard/RecommendedCourses'
import { LearningStreakCard } from '../components/Dashboard/LearningStreakCard'
import { CalendarHeatmap } from '../components/Dashboard/CalendarHeatmap'
import { BookmarksList } from '../components/Dashboard/BookmarksList'
import { NotesSummaryCard } from '../components/Dashboard/NotesSummaryCard'
import { formatStudyTime } from '../lib/dashboardUtils'

export function StudentDashboard() {
    const { user } = useAuth()
    const { dashboard, loading: dashboardLoading } = useStudentDashboard()
    const { courses: enrolledCourses, loading: coursesLoading } =
        useEnrolledCourses(10)
    const { lessons: continueWatching } = useContinueWatching(5)
    const { analytics: studyTime } = useStudyTime()
    const { streak, loading: streakLoading } = useLearningStreak()

    const activeCourses = enrolledCourses.filter(
        (enrollment) => enrollment.progressPercentage < 100
    )
    const completedCourses = enrolledCourses.filter(
        (enrollment) => enrollment.progressPercentage === 100
    )

    const totalProgress =
        enrolledCourses.length > 0
            ? enrolledCourses.reduce(
                  (acc, enrollment) =>
                      acc + (enrollment.progressPercentage || 0),
                  0
              ) / enrolledCourses.length
            : 0

    const stats = dashboard?.stats || {}
    const quickStats = [
        {
            label: 'Chuỗi học tập',
            value: streak?.currentStreak
                ? `${streak.currentStreak} ngày`
                : '0 ngày',
            icon: Flame,
            description: streak?.streakMaintained
                ? 'Đang duy trì'
                : 'Bắt đầu học ngay',
        },
        {
            label: 'Thời gian học tuần này',
            value: studyTime?.formatted?.thisWeek || '0h 0m',
            icon: Clock,
            description: studyTime?.totals?.thisWeek
                ? `Tổng ${Math.floor(studyTime.totals.thisWeek / 3600)}h`
                : 'Chưa có dữ liệu',
        },
        {
            label: 'Bài học đã hoàn thành',
            value: stats.totalLessonsCompleted || 0,
            icon: Target,
            description: `${stats.totalEnrollments || 0} khóa học đã đăng ký`,
        },
    ]

    const quickActions = [
        {
            label: 'Tiếp tục học',
            description: 'Quay lại bài giảng gần nhất',
            icon: PlayCircle,
            href:
                continueWatching.length > 0
                    ? `/courses/${continueWatching[0].course.slug}/lessons/${continueWatching[0].slug}`
                    : activeCourses.length > 0
                    ? `/courses/${activeCourses[0].course.slug}/lessons`
                    : '/courses',
        },
        {
            label: 'Khám phá lộ trình',
            description: 'Gợi ý khóa học phù hợp',
            icon: Compass,
            href: '/courses',
        },
        {
            label: 'Xem chứng chỉ',
            description: 'Theo dõi thành tích của bạn',
            icon: Award,
            href: '/certificates',
        },
    ]

    const loading = dashboardLoading || coursesLoading || streakLoading

    if (loading) {
        return (
            <div className='container mx-auto px-4 py-8 bg-background min-h-screen flex items-center justify-center'>
                <div className='text-center'>
                    <Loader2 className='h-8 w-8 animate-spin text-blue-500 mx-auto mb-4' />
                    <p className='text-gray-400'>Đang tải dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
            {/* Hero */}
            <section className='grid gap-6 lg:grid-cols-[2fr,1fr] mb-10'>
                <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-6 lg:p-8 relative overflow-hidden'>
                    <div className='absolute inset-y-0 right-0 w-1/3 opacity-20 pointer-events-none' />
                    <div className='relative z-10'>
                        <div className='flex flex-col gap-4'>
                            <div>
                                <p className='text-sm uppercase tracking-[0.2em] text-gray-500 mb-2'>
                                    Xin chào,
                                </p>
                                <h1 className='text-3xl md:text-4xl font-bold text-white'>
                                    {user?.fullName || 'Học viên'}
                                </h1>
                                <p className='text-gray-400 mt-2 text-base'>
                                    Tiếp tục hành trình chinh phục kỹ năng lập
                                    trình với lộ trình cá nhân hóa.
                                </p>
                            </div>
                            <div className='grid sm:grid-cols-3 gap-4'>
                                {quickStats.map((item, index) => (
                                    <div
                                        key={index}
                                        className='rounded-xl border border-[#2D2D2D] bg-[#1A1A1A] p-4'
                                    >
                                        <div className='flex items-center gap-2 text-gray-400 text-sm'>
                                            <item.icon className='h-4 w-4 text-blue-400' />
                                            {item.label}
                                        </div>
                                        <div className='text-2xl font-semibold text-white mt-2'>
                                            {item.value}
                                        </div>
                                        <p className='text-sm text-gray-500 mt-1'>
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className='grid md:grid-cols-3 gap-3'>
                                {quickActions.map((action) => (
                                    <DarkOutlineButton
                                        key={action.label}
                                        asChild
                                        className='justify-start gap-3 bg-black! py-8'
                                    >
                                        <Link to={action.href}>
                                            <action.icon className='h-4 w-4 text-blue-400' />
                                            <div className='text-left'>
                                                <p className='text-sm font-semibold text-black dark:text-white'>
                                                    {action.label}
                                                </p>
                                                <p className='text-xs text-gray-400'>
                                                    {action.description}
                                                </p>
                                            </div>
                                        </Link>
                                    </DarkOutlineButton>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D] rounded-2xl'>
                    <CardHeader className='pb-4'>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-blue-400' />
                            Hoạt động gần đây
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Xem các hoạt động học tập của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {continueWatching.length > 0 ? (
                            continueWatching.slice(0, 2).map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className='rounded-xl border border-[#2D2D2D] bg-black/40 p-4 flex flex-col gap-1'
                                >
                                    <Badge className='bg-blue-500/20 text-blue-400 border-blue-500/30 w-fit'>
                                        Đang học
                                    </Badge>
                                    <p className='text-white font-semibold mt-1 line-clamp-1'>
                                        {lesson.title}
                                    </p>
                                    <p className='text-sm text-gray-400 line-clamp-1'>
                                        {lesson.course.title}
                                    </p>
                                    <div className='flex items-center gap-2 text-sm text-gray-400 mt-2'>
                                        <Clock className='h-4 w-4 text-blue-400' />
                                        {formatStudyTime(lesson.watchDuration)}{' '}
                                        /{' '}
                                        {lesson.videoDuration
                                            ? formatStudyTime(
                                                  lesson.videoDuration
                                              )
                                            : 'N/A'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='text-gray-400 text-sm text-center py-4'>
                                Chưa có hoạt động gần đây
                            </p>
                        )}
                    </CardContent>
                    <CardContent className='pt-2 border-t border-[#2D2D2D]'>
                        <DarkOutlineButton asChild className='w-full'>
                            <Link to='/dashboard'>Xem chi tiết</Link>
                        </DarkOutlineButton>
                    </CardContent>
                </Card>
            </section>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-gray-400'>
                            Khóa học đã đăng ký
                        </CardTitle>
                        <BookOpen className='h-4 w-4 text-blue-600' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-white'>
                            {stats.totalEnrollments || enrolledCourses.length}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Tổng số khóa học
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-gray-400'>
                            Đang học
                        </CardTitle>
                        <PlayCircle className='h-4 w-4 text-green-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-white'>
                            {stats.activeEnrollments || activeCourses.length}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Khóa học đang học
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-gray-400'>
                            Đã hoàn thành
                        </CardTitle>
                        <CheckCircle className='h-4 w-4 text-purple-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-white'>
                            {stats.completedEnrollments ||
                                completedCourses.length}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Khóa học đã hoàn thành
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-gray-400'>
                            Tiến độ tổng quan
                        </CardTitle>
                        <TrendingUp className='h-4 w-4 text-orange-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-white'>
                            {Math.round(totalProgress)}%
                        </div>
                        <Progress value={totalProgress} className='mt-2' />
                    </CardContent>
                </Card>
            </div>

            {/* Continue Watching */}
            {continueWatching.length > 0 && (
                <div className='mb-8'>
                    <h2 className='text-2xl font-bold mb-4 text-black dark:text-white'>
                        Tiếp tục học
                    </h2>
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {continueWatching.slice(0, 3).map((lesson) => (
                            <Card
                                key={lesson.id}
                                className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-white/30 transition-colors overflow-hidden'
                            >
                                <Link
                                    to={`/courses/${lesson.course.slug}/lessons/${lesson.slug}`}
                                >
                                    <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                                        {lesson.course.thumbnailUrl ? (
                                            <img
                                                src={lesson.course.thumbnailUrl}
                                                alt={lesson.course.title}
                                                className='w-full h-full object-cover'
                                            />
                                        ) : (
                                            <div className='w-full h-full bg-[#2D2D2D] flex items-center justify-center'>
                                                <PlayCircle className='h-12 w-12 text-gray-500' />
                                            </div>
                                        )}
                                        <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
                                            <PlayCircle className='h-12 w-12 text-white' />
                                        </div>
                                    </div>
                                </Link>
                                <CardHeader>
                                    <CardTitle className='text-white line-clamp-2'>
                                        {lesson.title}
                                    </CardTitle>
                                    <CardDescription className='text-gray-400'>
                                        {lesson.course.title}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className='mb-4'>
                                        <div className='flex items-center justify-between text-xs text-gray-400 mb-1'>
                                            <span>
                                                Đã xem:{' '}
                                                {formatStudyTime(
                                                    lesson.watchDuration
                                                )}
                                            </span>
                                            {lesson.videoDuration && (
                                                <span>
                                                    Tổng:{' '}
                                                    {formatStudyTime(
                                                        lesson.videoDuration
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <Progress
                                            value={
                                                lesson.videoDuration
                                                    ? Math.min(
                                                          (lesson.watchDuration /
                                                              lesson.videoDuration) *
                                                              100,
                                                          100
                                                      )
                                                    : 0
                                            }
                                        />
                                    </div>
                                    <DarkOutlineButton
                                        asChild
                                        className='w-full'
                                    >
                                        <Link
                                            to={`/courses/${lesson.course.slug}/lessons/${lesson.slug}`}
                                        >
                                            Tiếp tục học
                                        </Link>
                                    </DarkOutlineButton>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* My Courses & Achievements */}
            <div className='grid lg:grid-cols-[2fr,1fr] gap-6'>
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-4'>
                        <h2 className='text-2xl font-bold text-black dark:text-white'>
                            Khóa học của tôi
                        </h2>
                        <DarkOutlineButton asChild>
                            <Link to='/courses'>Xem tất cả</Link>
                        </DarkOutlineButton>
                    </div>
                    <div className='grid md:grid-cols-2 gap-6'>
                        {enrolledCourses.map((enrollment) => {
                            const course = enrollment.course
                            return (
                                <Card
                                    key={enrollment.id}
                                    className='bg-[#1A1A1A] border-[#2D2D2D] overflow-hidden'
                                >
                                    <Link to={`/courses/${course.slug}`}>
                                        <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                                            {course.thumbnailUrl ? (
                                                <img
                                                    src={course.thumbnailUrl}
                                                    alt={course.title}
                                                    className='w-full h-full object-cover'
                                                />
                                            ) : (
                                                <div className='w-full h-full bg-[#2D2D2D] flex items-center justify-center'>
                                                    <BookOpen className='h-12 w-12 text-gray-500' />
                                                </div>
                                            )}
                                            {enrollment.progressPercentage ===
                                                100 && (
                                                <div className='absolute top-2 right-2'>
                                                    <Badge className='bg-green-600'>
                                                        <CheckCircle className='h-3 w-3 mr-1' />
                                                        Hoàn thành
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <CardHeader>
                                        <CardTitle className='text-white line-clamp-2'>
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className='text-gray-400'>
                                            {enrollment.progressPercentage}%
                                            hoàn thành
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Progress
                                            value={
                                                enrollment.progressPercentage
                                            }
                                            className='mb-4'
                                        />
                                        <div className='flex gap-2'>
                                            <DarkOutlineButton
                                                asChild
                                                className='flex-1'
                                            >
                                                <Link
                                                    to={`/courses/${course.slug}`}
                                                >
                                                    Xem chi tiết
                                                </Link>
                                            </DarkOutlineButton>
                                            <DarkOutlineButton
                                                asChild
                                                className='flex-1'
                                            >
                                                <Link
                                                    to={`/courses/${course.slug}/lessons`}
                                                >
                                                    Học tiếp
                                                </Link>
                                            </DarkOutlineButton>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                <div className='space-y-6'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white flex items-center gap-2'>
                                <BookmarkCheck className='h-4 w-4 text-blue-400' />
                                Thành tích nổi bật
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Kỷ niệm các cột mốc quan trọng của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='rounded-xl border border-[#2D2D2D] p-4 bg-black/40'>
                                <p className='text-white font-semibold'>
                                    Chứng chỉ mới
                                </p>
                                <p className='text-sm text-gray-400'>
                                    {completedCourses.length > 0
                                        ? `${completedCourses[0].course.title}`
                                        : 'Hãy hoàn thành khóa học để nhận chứng chỉ đầu tiên.'}
                                </p>
                                <DarkOutlineButton className='mt-3 w-full'>
                                    Xem chứng chỉ
                                </DarkOutlineButton>
                            </div>
                            <div className='rounded-xl border border-[#2D2D2D] p-4 bg-black/40'>
                                <p className='text-white font-semibold'>
                                    Tiến độ tổng quan
                                </p>
                                <p className='text-sm text-gray-400'>
                                    Bạn đã hoàn thành{' '}
                                    {Math.round(totalProgress)}% mục tiêu đã
                                    đăng ký
                                </p>
                                <Progress
                                    value={totalProgress}
                                    className='mt-3'
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white flex items-center gap-2'>
                                <BookOpen className='h-4 w-4 text-blue-400' />
                                Gợi ý tiếp theo
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Những nội dung phù hợp với mục tiêu của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            {enrolledCourses.length === 0 && (
                                <p className='text-gray-400 text-sm text-center py-4'>
                                    Chưa có khóa học nào. Hãy khám phá các khóa
                                    học mới!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Phase 1: New Features */}
            <div className='space-y-6 mb-10'>
                <h2 className='text-2xl font-bold text-black dark:text-white'>
                    Phân tích & Thống kê
                </h2>

                {/* Recent Activities & Quiz Performance */}
                <div className='grid lg:grid-cols-2 gap-6'>
                    <RecentActivities />
                    <QuizPerformanceSummary />
                </div>

                {/* Study Time Analytics */}
                <StudyTimeChart />
            </div>

            {/* Phase 2: Learning Streak & Calendar */}
            <div className='grid lg:grid-cols-2 gap-6 mb-10'>
                <LearningStreakCard />
                <CalendarHeatmap />
            </div>

            {/* Phase 2: Bookmarks & Notes */}
            <div className='grid lg:grid-cols-2 gap-6 mb-10'>
                <BookmarksList />
                <NotesSummaryCard />
            </div>

            {/* Recommended Courses */}
            <div className='mb-10'>
                <RecommendedCourses />
            </div>
        </div>
    )
}
