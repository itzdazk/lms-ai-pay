import { useState, useEffect, useMemo } from 'react'
import { EnrollmentList, EnrollmentFilters } from '../components/Enrollments'
import { BookOpen, TrendingUp, Award, Sparkles } from 'lucide-react'
import { enrollmentsApi } from '../lib/api/enrollments'
import type { EnrollmentWithCourse } from '../lib/api/enrollments'
import type { EnrollmentStatus } from '../lib/api/types'

export function MyCoursesPage() {
    const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: undefined as EnrollmentStatus | undefined,
        search: '',
        sort: 'newest' as 'newest' | 'oldest' | 'progress',
    })

    useEffect(() => {
        fetchEnrollments()
    }, [filters])

    const fetchEnrollments = async () => {
        try {
            setIsLoading(true)
            const response = await enrollmentsApi.getEnrollments(filters)
            setEnrollments(response.data)
        } catch (error) {
            console.error('Failed to fetch enrollments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = (status?: EnrollmentStatus) => {
        setFilters((prev) => ({ ...prev, status }))
    }

    const handleSearchChange = (search: string) => {
        setFilters((prev) => ({ ...prev, search }))
    }

    const handleSortChange = (sort: 'newest' | 'oldest' | 'progress') => {
        setFilters((prev) => ({ ...prev, sort }))
    }

    // Calculate stats with useMemo for performance
    const stats = useMemo(() => {
        const total = enrollments.length
        const active = enrollments.filter((e) => e.status === 'ACTIVE').length
        const completed = enrollments.filter(
            (e) => e.status === 'COMPLETED'
        ).length

        // Convert progressPercentage to number and calculate average
        const avgProgress =
            total > 0
                ? Math.round(
                      enrollments.reduce((sum, e) => {
                          const progress =
                              typeof e.progressPercentage === 'string'
                                  ? parseFloat(e.progressPercentage) || 0
                                  : e.progressPercentage || 0
                          return sum + progress
                      }, 0) / total
                  )
                : 0

        return {
            total,
            active,
            completed,
            avgProgress,
        }
    }, [enrollments])

    const hasFilters = filters.search !== '' || filters.status !== undefined

    const statCards = [
        {
            title: 'Tổng khóa học',
            value: stats.total,
            icon: BookOpen,
            gradient: 'from-violet-500 to-purple-600',
            bgGradient: 'from-violet-500/10 to-purple-600/10',
            iconColor: 'text-violet-600',
        },
        {
            title: 'Đang học',
            value: stats.active,
            icon: TrendingUp,
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-500/10 to-cyan-600/10',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Hoàn thành',
            value: stats.completed,
            icon: Award,
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-500/10 to-emerald-600/10',
            iconColor: 'text-green-600',
        },
        {
            title: 'Tiến độ TB',
            value: `${stats.avgProgress}%`,
            icon: Sparkles,
            gradient: 'from-orange-500 to-pink-600',
            bgGradient: 'from-orange-500/10 to-pink-600/10',
            iconColor: 'text-orange-600',
        },
    ]

    return (
        <div className='min-h-screen bg-background'>
            {/* Hero Header */}
            <div className='relative overflow-hidden border-b border-border bg-card'>
                <div className='absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.05] bg-[size:20px_20px]'></div>

                <div className='relative container mx-auto px-4 py-12'>
                    <div className='text-center mb-12 animate-fade-in-up'>
                        <h1 className='text-4xl md:text-5xl text-foreground mb-4 font-bold'>
                            Hành trình học tập của tôi
                        </h1>
                        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                            Theo dõi tiến độ, tiếp tục học tập và đạt được mục
                            tiêu của bạn
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                        {statCards.map((stat) => (
                            <div key={stat.title}>
                                <div className='bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-white/20 dark:bg-black/50 dark:border-black/20'>
                                    <div className='flex items-start justify-between mb-4'>
                                        <div
                                            className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <stat.icon
                                                className={`h-6 w-6 ${stat.iconColor}`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-600 mb-1'>
                                            {stat.title}
                                        </p>
                                        <p
                                            className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                                        >
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 py-8'>
                {/* Filters */}
                <div
                    className='mb-8 animate-fade-in-up'
                    style={{ animationDelay: '400ms' }}
                >
                    <EnrollmentFilters
                        status={filters.status}
                        search={filters.search}
                        sort={filters.sort}
                        onStatusChange={handleStatusChange}
                        onSearchChange={handleSearchChange}
                        onSortChange={handleSortChange}
                    />
                </div>

                {/* Enrollments List */}
                <div
                    className='animate-fade-in-up'
                    style={{ animationDelay: '500ms' }}
                >
                    <EnrollmentList
                        enrollments={enrollments}
                        isLoading={isLoading}
                        hasFilters={hasFilters}
                        status={filters.status}
                    />
                </div>
            </div>
        </div>
    )
}
