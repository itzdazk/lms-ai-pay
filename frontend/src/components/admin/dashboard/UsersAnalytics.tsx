import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi, type UsersAnalytics } from '../../../lib/api/admin-dashboard'
import { LineChart, PieChart, BarChart } from './charts'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export function UsersAnalytics() {
    const { data, isLoading, error } = useQuery<UsersAnalytics>({
        queryKey: ['admin-users-analytics'],
        queryFn: adminDashboardApi.getUsersAnalytics,
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
                    <p className='text-red-400'>Không thể tải dữ liệu phân tích người dùng</p>
                </CardContent>
            </Card>
        )
    }

    // Format registration trend data
    const registrationTrendData = data.registrationTrend.map((item) => ({
        date: format(new Date(item.date), 'dd/MM', { locale: vi }),
        users: item.users,
    }))

    // Format role distribution
    const roleDistributionData = data.distribution.byRole.map((item) => ({
        name:
            item.role === 'ADMIN'
                ? 'Quản trị viên'
                : item.role === 'INSTRUCTOR'
                  ? 'Giảng viên'
                  : 'Học viên',
        value: item.count,
    }))

    // Format status distribution
    const statusDistributionData = data.distribution.byStatus.map((item) => ({
        name:
            item.status === 'ACTIVE'
                ? 'Hoạt động'
                : item.status === 'INACTIVE'
                  ? 'Không hoạt động'
                  : 'Bị khóa',
        value: item.count,
    }))

    return (
        <div className='space-y-6'>
            {/* Registration Trend */}
            <LineChart
                title='Xu hướng đăng ký (30 ngày qua)'
                description='Số lượng người dùng đăng ký mới mỗi ngày'
                data={registrationTrendData}
                dataKey='users'
                xAxisKey='date'
                strokeColor='#3b82f6'
                height={300}
                formatTooltip={(value) => [`${value} người dùng`, 'Đăng ký']}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Role Distribution */}
                <PieChart
                    title='Phân bố theo vai trò'
                    data={roleDistributionData}
                    colors={['#3b82f6', '#8b5cf6', '#10b981']}
                    height={300}
                    formatTooltip={(value) => [`${value} người`, '']}
                />

                {/* Status Distribution */}
                <BarChart
                    title='Phân bố theo trạng thái'
                    data={statusDistributionData}
                    dataKey='value'
                    xAxisKey='name'
                    fillColor='#8b5cf6'
                    height={300}
                    formatTooltip={(value) => [`${value} người`, '']}
                />
            </div>

            {/* Top Active Users */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Top 10 người dùng hoạt động</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-3'>
                        {data.topActiveUsers.map((user) => (
                            <div
                                key={user.id}
                                className='flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg hover:bg-[#252525] transition-colors'
                            >
                                <div className='flex items-center gap-3'>
                                    <Avatar className='h-10 w-10'>
                                        <AvatarImage src={user.avatarUrl || undefined} />
                                        <AvatarFallback className='bg-blue-600 text-white'>
                                            {user.fullName
                                                ? user.fullName
                                                      .split(' ')
                                                      .map((n) => n[0])
                                                      .join('')
                                                : user.userName[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className='text-white font-medium'>
                                            {user.fullName || user.userName}
                                        </p>
                                        <p className='text-xs text-gray-400'>{user.email}</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-white font-semibold'>
                                        {user.totalEnrollments} đăng ký
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {user.completedLessons} bài học hoàn thành
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Người dùng mới đăng ký (30 ngày qua)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-3'>
                        {data.recentUsers.map((user) => (
                            <div
                                key={user.id}
                                className='flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg hover:bg-[#252525] transition-colors'
                            >
                                <div className='flex items-center gap-3'>
                                    <div className='h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center'>
                                        <span className='text-blue-400 font-semibold'>
                                            {user.fullName
                                                ? user.fullName[0].toUpperCase()
                                                : user.userName[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className='text-white font-medium'>
                                            {user.fullName || user.userName}
                                        </p>
                                        <p className='text-xs text-gray-400'>{user.email}</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-sm text-gray-300'>
                                        {user.role === 'ADMIN'
                                            ? 'Quản trị viên'
                                            : user.role === 'INSTRUCTOR'
                                              ? 'Giảng viên'
                                              : 'Học viên'}
                                    </p>
                                    <p className='text-xs text-gray-500'>
                                        {format(new Date(user.createdAt), 'dd/MM/yyyy', {
                                            locale: vi,
                                        })}
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


