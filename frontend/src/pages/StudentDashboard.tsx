import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Progress } from '../components/ui/progress'
import {
    Clock,
    Award,
    TrendingUp,
    PlayCircle,
    CheckCircle,
    Flame,
    Target,
    Loader2,
    BookOpen,
    History,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStudentDashboard } from '../hooks/useStudentDashboard'
import { useEnrolledCourses } from '../hooks/useEnrolledCourses'
import { useStudyTime } from '../hooks/useStudyTime'
import { useLearningStreak } from '../hooks/useLearningStreak'
import {
    StudyTimeAnalytics,
    StatCard,
    MyCoursesSection,
    AchievementsSection,
    NextRecommendationsSection,
    RecentActivitiesModal,
} from '../components/Dashboard'

export function StudentDashboard() {
    const { user } = useAuth()
    const { dashboard, loading: dashboardLoading } = useStudentDashboard()
    const { courses: enrolledCourses, loading: coursesLoading } =
        useEnrolledCourses(10)
    const { analytics: studyTime } = useStudyTime()
    const { streak, loading: streakLoading } = useLearningStreak()
    const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false)

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
                activeCourses.length > 0
                    ? `/courses/${activeCourses[0].course.slug}/lessons`
                    : '/courses',
        },
        {
            label: 'Hoạt động gần đây',
            description: 'Xem lịch sử học tập của bạn',
            icon: History,
            onClick: () => setIsActivitiesModalOpen(true),
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
            <section className='mb-10'>
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
                                        asChild={!!action.href}
                                        onClick={action.onClick || undefined}
                                        className='justify-start gap-3 bg-black! py-8'
                                    >
                                        {action.href ? (
                                            <Link to={action.href}>
                                                <action.icon className='h-4 w-4 text-blue-400' />
                                                <div className='text-left'>
                                                    <p className='text-sm font-semibold text-white'>
                                                        {action.label}
                                                    </p>
                                                    <p className='text-xs text-gray-400'>
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className='flex items-center gap-3 w-full'>
                                                <action.icon className='h-4 w-4 text-blue-400' />
                                                <div className='text-left'>
                                                    <p className='text-sm font-semibold text-white'>
                                                        {action.label}
                                                    </p>
                                                    <p className='text-xs text-gray-400'>
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </DarkOutlineButton>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
                <StatCard
                    title='Khóa học đã đăng ký'
                    value={stats.totalEnrollments || enrolledCourses.length}
                    icon={BookOpen}
                    iconColor='text-violet-400'
                    bgColor='bg-violet-950/50'
                    borderColor='border-violet-900'
                    description='Tổng số khóa học'
                />
                <StatCard
                    title='Đang học'
                    value={stats.activeEnrollments || activeCourses.length}
                    icon={PlayCircle}
                    iconColor='text-blue-400'
                    bgColor='bg-blue-950/50'
                    borderColor='border-blue-900'
                    description='Khóa học đang học'
                />
                <StatCard
                    title='Đã hoàn thành'
                    value={
                        stats.completedEnrollments || completedCourses.length
                    }
                    icon={CheckCircle}
                    iconColor='text-green-400'
                    bgColor='bg-green-950/50'
                    borderColor='border-green-900'
                    description='Khóa học đã hoàn thành'
                />
                <div className='bg-[#1A1A1A] border-l-4 border-orange-900 rounded-lg p-4 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-gray-300 dark:text-gray-300'>
                            Tiến độ tổng quan
                        </span>
                        <div className='p-2.5 rounded-lg bg-orange-950/50'>
                            <TrendingUp className='h-4 w-4 text-orange-400' />
                        </div>
                    </div>
                    <div className='text-2xl font-bold text-gray-300 dark:text-gray-300 mb-2'>
                        {Math.round(totalProgress)}%
                    </div>
                    <Progress value={totalProgress} />
                </div>
            </div>

            {/* My Courses & Achievements */}
            <div className='grid lg:grid-cols-[2fr,1fr] gap-6 mb-10'>
                <MyCoursesSection enrollments={enrolledCourses} />
                {/* Recommended Courses */}
                <NextRecommendationsSection enrolledCourses={enrolledCourses} />
            </div>

            {/* Analytics Section */}
            <div className='space-y-6 mb-10'>
                <h2 className='text-2xl font-bold text-black dark:text-white'>
                    Phân tích & Thống kê
                </h2>

                {/* Study Time Analytics */}
                <StudyTimeAnalytics />
            </div>

            {/* Achievements Section */}
            <div className='grid lg:grid-cols-[2fr,1fr] gap-6 mb-10'>
                <div className='space-y-6'>
                    <AchievementsSection
                        completedCourses={completedCourses}
                        totalProgress={totalProgress}
                    />
                </div>
            </div>

            {/* Recent Activities Modal */}
            <RecentActivitiesModal
                open={isActivitiesModalOpen}
                onOpenChange={setIsActivitiesModalOpen}
            />
        </div>
    )
}
