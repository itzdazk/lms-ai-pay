import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi, type RecentActivities, type ActivityType } from '../../../lib/api/admin-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Loader2, ShoppingCart, UserPlus, BookOpen, GraduationCap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState, useMemo } from 'react'
import { formatPrice } from '../../../lib/courseUtils'

export function RecentActivities() {
    const [filter, setFilter] = useState<ActivityType | 'all'>('all')
    const { data, isLoading, error } = useQuery<RecentActivities>({
        queryKey: ['admin-recent-activities'],
        queryFn: () => adminDashboardApi.getActivities(20),
        refetchInterval: 30000, // 30 seconds
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Combine all activities and sort by timestamp
    const allActivities = useMemo(() => {
        if (!data) return []
        
        const activities: Array<{
            type: ActivityType
            id: number
            timestamp: string
            message: string
            icon: React.ReactNode
            color: string
            bgColor: string
        }> = []

        // Add orders
        data.recentOrders.forEach((order) => {
            activities.push({
                type: 'order',
                id: order.id,
                timestamp: order.timestamp,
                message: `${order.user.fullName} đã mua khóa học "${order.course.title}" với giá ${formatPrice(order.amount)}`,
                icon: <ShoppingCart className='h-5 w-5' />,
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/20',
            })
        })

        // Add enrollments
        data.recentEnrollments.forEach((enrollment) => {
            activities.push({
                type: 'enrollment',
                id: enrollment.id,
                timestamp: enrollment.timestamp,
                message: `${enrollment.user.fullName} đã đăng ký khóa học "${enrollment.course.title}"`,
                icon: <GraduationCap className='h-5 w-5' />,
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
            })
        })

        // Add user registrations
        data.recentUsers.forEach((user) => {
            activities.push({
                type: 'user_registration',
                id: user.id,
                timestamp: user.timestamp,
                message: `${user.fullName} (${user.email}) đã đăng ký tài khoản với vai trò ${
                    user.role === 'ADMIN'
                        ? 'Quản trị viên'
                        : user.role === 'INSTRUCTOR'
                          ? 'Giảng viên'
                          : 'Học viên'
                }`,
                icon: <UserPlus className='h-5 w-5' />,
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/20',
            })
        })

        // Add course publications
        data.recentCourses.forEach((course) => {
            activities.push({
                type: 'course_published',
                id: course.id,
                timestamp: course.timestamp,
                message: `Khóa học "${course.title}" đã được xuất bản bởi ${course.instructor.fullName}`,
                icon: <BookOpen className='h-5 w-5' />,
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/20',
            })
        })

        // Sort by timestamp (newest first)
        return activities.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [data])

    // Filter activities
    const filteredActivities = useMemo(() => {
        if (filter === 'all') return allActivities
        return allActivities.filter((activity) => activity.type === filter)
    }, [allActivities, filter])

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
                    <p className='text-red-400'>Không thể tải hoạt động gần đây</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle className='text-white'>Hoạt động gần đây</CardTitle>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setFilter('all')}
                            className='text-xs'
                        >
                            Tất cả
                        </Button>
                        <Button
                            variant={filter === 'order' ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setFilter('order')}
                            className='text-xs'
                        >
                            Đơn hàng
                        </Button>
                        <Button
                            variant={filter === 'enrollment' ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setFilter('enrollment')}
                            className='text-xs'
                        >
                            Đăng ký
                        </Button>
                        <Button
                            variant={filter === 'user_registration' ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setFilter('user_registration')}
                            className='text-xs'
                        >
                            Người dùng
                        </Button>
                        <Button
                            variant={filter === 'course_published' ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setFilter('course_published')}
                            className='text-xs'
                        >
                            Khóa học
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className='space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar'>
                    {filteredActivities.length === 0 ? (
                        <p className='text-gray-400 text-center py-8'>
                            Không có hoạt động nào
                        </p>
                    ) : (
                        filteredActivities.map((activity) => (
                            <div
                                key={`${activity.type}-${activity.id}`}
                                className='flex items-start gap-3 p-4 bg-[#1F1F1F] rounded-lg hover:bg-[#252525] transition-colors'
                            >
                                <div
                                    className={`flex items-center justify-center h-10 w-10 rounded-lg ${activity.bgColor} ${activity.color} flex-shrink-0`}
                                >
                                    {activity.icon}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-white text-sm'>{activity.message}</p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        {formatDistanceToNow(new Date(activity.timestamp), {
                                            addSuffix: true,
                                            locale: vi,
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

