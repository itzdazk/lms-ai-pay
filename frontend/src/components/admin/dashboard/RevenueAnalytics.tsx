import { useQuery } from '@tanstack/react-query'
import {
    adminDashboardApi,
    type RevenueAnalytics,
} from '../../../lib/api/admin-dashboard'
import { AreaChart, PieChart } from './charts'
import { ComparisonCard } from './cards'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

export function RevenueAnalytics() {
    const { data, isLoading, error } = useQuery<RevenueAnalytics>({
        queryKey: ['admin-revenue-analytics'],
        queryFn: adminDashboardApi.getRevenueAnalytics,
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
                        Không thể tải dữ liệu phân tích doanh thu
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Format revenue trend data
    const revenueTrendData = data.trend.map((item) => ({
        date: format(new Date(item.date), 'dd/MM', { locale: vi }),
        revenue: item.revenue,
        orders: item.orders,
    }))

    // Format payment gateway distribution
    const gatewayData = data.byPaymentGateway.map((item) => ({
        name: item.gateway,
        value: item.revenue,
        orders: item.orders,
    }))

    return (
        <div className='space-y-6'>
            {/* Revenue Trend */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Xu hướng doanh thu (30 ngày qua)
                    </CardTitle>
                    <p className='text-sm text-gray-400 mt-1'>
                        Doanh thu và số đơn hàng theo ngày
                    </p>
                </CardHeader>
                <CardContent>
                    <AreaChart
                        data={revenueTrendData}
                        dataKey='revenue'
                        xAxisKey='date'
                        strokeColor='#10b981'
                        fillColor='#10b981'
                        height={350}
                        formatTooltip={(value) => [
                            formatPrice(Number(value)),
                            'Doanh thu',
                        ]}
                    />
                </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <ComparisonCard
                    title='Doanh thu tháng này vs tháng trước'
                    current={data.monthlyComparison.current.revenue}
                    previous={data.monthlyComparison.previous.revenue}
                    formatValue={formatPrice}
                />
                <ComparisonCard
                    title='Số đơn hàng tháng này vs tháng trước'
                    current={data.monthlyComparison.current.orders}
                    previous={data.monthlyComparison.previous.orders}
                />
            </div>

            {/* Payment Gateway Distribution */}
            <PieChart
                title='Phân bố theo cổng thanh toán'
                description='Doanh thu theo từng cổng thanh toán'
                data={gatewayData}
                colors={['#3b82f6', '#10b981', '#f59e0b']}
                height={300}
                formatTooltip={(value) => [
                    formatPrice(Number(value)),
                    'Doanh thu',
                ]}
            />

            {/* Top Revenue Courses */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Top 10 khóa học doanh thu cao
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-3'>
                        {data.topRevenueCourses.map((course) => (
                            <div
                                key={course.id}
                                className='flex items-center gap-4 p-3 bg-[#1F1F1F] rounded-lg hover:bg-[#252525] transition-colors'
                            >
                                <Avatar className='h-16 w-28 rounded-lg flex-shrink-0'>
                                    <AvatarImage
                                        src={course.thumbnailUrl || undefined}
                                        className='object-cover'
                                    />
                                    <AvatarFallback className='bg-yellow-600 text-white rounded-lg'>
                                        {course.title[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-white font-medium truncate'>
                                        {course.title}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {course.instructor.fullName}
                                    </p>
                                    <div className='flex items-center gap-4 mt-2'>
                                        <span className='text-sm text-gray-300'>
                                            💰{' '}
                                            {formatPrice(course.totalRevenue)}
                                        </span>
                                        <span className='text-sm text-gray-300'>
                                            📦 {course.totalOrders} đơn hàng
                                        </span>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-white font-semibold'>
                                        {formatPrice(Number(course.price))}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        Giá khóa học
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
