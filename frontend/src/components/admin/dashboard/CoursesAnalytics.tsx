import { useQuery } from '@tanstack/react-query'
import {
    adminDashboardApi,
    type CoursesAnalytics,
} from '../../../lib/api/admin-dashboard'
import { BarChart, PieChart } from './charts'
import { MetricCard } from './cards'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '../../../lib/courseUtils'

export function CoursesAnalytics() {
    const { data, isLoading, error } = useQuery<CoursesAnalytics>({
        queryKey: ['admin-courses-analytics'],
        queryFn: adminDashboardApi.getCoursesAnalytics,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            </div>
        )
    }

    if (error || !data) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-6'>
                    <p className='text-red-400'>
                        Không thể tải dữ liệu phân tích khóa học
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Format category distribution (top 10)
    const categoryData = data.distribution.byCategory
        .slice(0, 10)
        .map((item) => ({
            name:
                item.categoryName.length > 10
                    ? item.categoryName.substring(0, 7) + '...'
                    : item.categoryName,
            full_category_name: item.categoryName,
            courses: item.courseCount,
            enrollments: item.totalEnrollments,
        }))

    // Format level distribution
    const levelData = data.distribution.byLevel.map((item) => ({
        name:
            item.level === 'BEGINNER'
                ? 'Cơ bản'
                : item.level === 'INTERMEDIATE'
                ? 'Trung bình'
                : item.level === 'ADVANCED'
                ? 'Nâng cao'
                : 'Không xác định',
        value: item.courseCount,
    }))

    return (
        <div className='space-y-6'>
            {/* Metrics Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <MetricCard
                    title='Trung bình đăng ký'
                    value={parseFloat(data.metrics.averageEnrollments).toFixed(
                        0
                    )}
                    description='Số đăng ký trung bình mỗi khóa học'
                />
                <MetricCard
                    title='Đánh giá trung bình'
                    value={parseFloat(data.metrics.averageRating).toFixed(1)}
                    description='Điểm đánh giá trung bình'
                />
                <MetricCard
                    title='Lượt xem trung bình'
                    value={parseFloat(data.metrics.averageViews).toFixed(0)}
                    description='Lượt xem trung bình mỗi khóa học'
                />
                <MetricCard
                    title='Tỷ lệ hoàn thành'
                    value={`${parseFloat(
                        data.metrics.averageCompletionRate
                    ).toFixed(1)}%`}
                    description='Tỷ lệ hoàn thành trung bình'
                />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Category Distribution */}
                <BarChart
                    title='Phân bố theo danh mục (Top 10)'
                    description='Số lượng khóa học theo danh mục'
                    data={categoryData}
                    dataKey='courses'
                    xAxisKey='name'
                    fillColor='#10b981'
                    height={350}
                    formatTooltip={(value) => [`${value} khóa học`, '']}
                    formatLabel={(label, payload) => {
                        if (
                            payload &&
                            payload[0] &&
                            payload[0].payload?.full_category_name
                        ) {
                            return payload[0].payload.full_category_name
                        }
                        return label
                    }}
                />

                {/* Level Distribution */}
                <PieChart
                    title='Phân bố theo cấp độ'
                    data={levelData}
                    colors={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']}
                    height={350}
                    formatTooltip={(value) => [`${value} khóa học`, '']}
                />
            </div>

            {/* Top Performing Courses */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Top 10 khóa học hiệu quả
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-3'>
                        {data.topPerformingCourses.map((course) => (
                            <div
                                key={course.id}
                                className='flex items-center gap-4 p-3 bg-[#1F1F1F] rounded-lg hover:bg-[#252525] transition-colors'
                            >
                                <Avatar className='h-16 w-28 rounded-lg flex-shrink-0'>
                                    <AvatarImage
                                        src={course.thumbnailUrl || undefined}
                                        className='object-cover'
                                    />
                                    <AvatarFallback className='bg-green-600 text-white rounded-lg'>
                                        {course.title[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-white font-medium truncate'>
                                        {course.title}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {course.category.name} •{' '}
                                        {course.instructor.fullName}
                                    </p>
                                    <div className='flex items-center gap-4 mt-2'>
                                        <span className='text-sm text-gray-300'>
                                            ⭐{' '}
                                            {Number(course.ratingAvg).toFixed(
                                                1
                                            )}{' '}
                                            ({course.ratingCount})
                                        </span>
                                        <span className='text-sm text-gray-300'>
                                            👥 {course.enrolledCount}
                                        </span>
                                        <span className='text-sm text-gray-300'>
                                            👁️ {course.viewsCount}
                                        </span>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-white font-semibold'>
                                        {formatPrice(Number(course.price))}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
