import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi, type DashboardOverview } from '../../../lib/api/admin-dashboard'
import { StatCard } from './cards'
import { Users, BookOpen, DollarSign, TrendingUp, ShoppingCart, GraduationCap } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '../../../lib/utils'

export function OverviewStats() {
    const { data, isLoading, error } = useQuery<DashboardOverview>({
        queryKey: ['admin-dashboard-overview'],
        queryFn: adminDashboardApi.getOverview,
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
            <div className='text-red-400 p-4'>
                Không thể tải dữ liệu tổng quan
            </div>
        )
    }

    const { summary } = data

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
                title='Tổng người dùng'
                value={summary.users.total}
                icon={<Users className='h-4 w-4 text-blue-500' />}
                growth={summary.users.growthPercentage}
                subtitle={`${summary.users.students} học viên • ${summary.users.instructors} giảng viên`}
                trend={
                    summary.users.growthPercentage > 0
                        ? 'up'
                        : summary.users.growthPercentage < 0
                          ? 'down'
                          : 'neutral'
                }
            />
            <StatCard
                title='Tổng khóa học'
                value={summary.courses.total}
                icon={<BookOpen className='h-4 w-4 text-green-500' />}
                subtitle={`${summary.courses.published} đã xuất bản • ${summary.courses.draft} bản nháp`}
            />
            <StatCard
                title='Tổng doanh thu'
                value={formatPrice(summary.revenue.total)}
                icon={<DollarSign className='h-4 w-4 text-yellow-500' />}
                growth={summary.revenue.growthPercentage}
                subtitle={`Trung bình: ${formatPrice(summary.revenue.averageOrderValue)}/đơn`}
                trend={
                    summary.revenue.growthPercentage > 0
                        ? 'up'
                        : summary.revenue.growthPercentage < 0
                          ? 'down'
                          : 'neutral'
                }
            />
            <StatCard
                title='Tổng đăng ký'
                value={summary.enrollments.total}
                icon={<GraduationCap className='h-4 w-4 text-purple-500' />}
                growth={summary.enrollments.growthPercentage}
                subtitle={`${summary.enrollments.active} đang học • ${summary.enrollments.completed} đã hoàn thành`}
                trend={
                    summary.enrollments.growthPercentage > 0
                        ? 'up'
                        : summary.enrollments.growthPercentage < 0
                          ? 'down'
                          : 'neutral'
                }
            />
        </div>
    )
}

