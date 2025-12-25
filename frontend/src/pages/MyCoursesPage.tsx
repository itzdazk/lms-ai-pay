import { useState, useEffect, useMemo } from 'react'
import { EnrollmentList, EnrollmentFilters } from '../components/Enrollments'
import { BookOpen, TrendingUp, Award, Sparkles } from 'lucide-react'
import { enrollmentsApi } from '../lib/api/enrollments'
import type { EnrollmentWithCourse } from '../lib/api/enrollments'
import type { EnrollmentStatus } from '../lib/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

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
            label: 'Tổng khóa học',
            value: stats.total,
            icon: BookOpen,
            color: 'text-violet-400',
            bgColor: 'bg-violet-950/50',
            borderColor: 'border-violet-900',
        },
        {
            label: 'Đang học',
            value: stats.active,
            icon: TrendingUp,
            color: 'text-blue-400',
            bgColor: 'bg-blue-950/50',
            borderColor: 'border-blue-900',
        },
        {
            label: 'Hoàn thành',
            value: stats.completed,
            icon: Award,
            color: 'text-green-400',
            bgColor: 'bg-green-950/50',
            borderColor: 'border-green-900',
        },
        {
            label: 'Tiến độ TB',
            value: `${stats.avgProgress}%`,
            icon: Sparkles,
            color: 'text-orange-400',
            bgColor: 'bg-orange-950/50',
            borderColor: 'border-orange-900',
        },
    ]

    return (
        <div className='bg-background min-h-screen'>
            {/* Header Section */}
            <div className='bg-[#1A1A1A] border-b border-gray-800 dark:border-gray-800'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='mb-8'>
                        <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white dark:text-white'>
                            Hành trình học tập của tôi
                        </h1>
                        <p className='text-base text-gray-300 dark:text-gray-300 leading-relaxed'>
                            Theo dõi tiến độ, tiếp tục học tập và đạt được mục
                            tiêu của bạn
                        </p>
                    </div>
                    {/* Stats */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {statCards.map((stat) => (
                            <Card
                                key={stat.label}
                                className={`overflow-hidden border-l-4 ${stat.borderColor} bg-[#1A1A1A] hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                            >
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium text-gray-300 dark:text-gray-300'>
                                        {stat.label}
                                    </CardTitle>
                                    <div
                                        className={`p-2.5 rounded-lg ${stat.bgColor}`}
                                    >
                                        <stat.icon
                                            className={`h-4 w-4 ${stat.color}`}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className='space-y-1'>
                                        <div className='text-2xl font-bold text-gray-300 dark:text-gray-300'>
                                            {stat.value}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                {/* Filters */}
                <EnrollmentFilters
                    status={filters.status}
                    search={filters.search}
                    sort={filters.sort}
                    onStatusChange={handleStatusChange}
                    onSearchChange={handleSearchChange}
                    onSortChange={handleSortChange}
                />

                {/* Enrollments List */}
                <div className='mt-6'>
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
