import { useQuery } from '@tanstack/react-query'
import { adminDashboardApi, type SystemStats } from '../../../lib/api/admin-dashboard'
import { MetricCard } from './cards'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Loader2 } from 'lucide-react'

export function SystemStats() {
    const { data, isLoading, error } = useQuery<SystemStats>({
        queryKey: ['admin-system-stats'],
        queryFn: adminDashboardApi.getSystemStats,
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
                    <p className='text-red-400'>Không thể tải thống kê hệ thống</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='space-y-6'>
            {/* Content Stats */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thống kê nội dung</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <MetricCard
                            title='Tổng số bài học'
                            value={data.content.lessons.total}
                            description={`${data.content.lessons.published} bài học đã xuất bản`}
                        />
                        <MetricCard
                            title='Tổng số bài kiểm tra'
                            value={data.content.quizzes.total}
                            description='Tổng số bài kiểm tra trong hệ thống'
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Engagement Stats */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thống kê tương tác</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <MetricCard
                            title='Tổng tiến độ học tập'
                            value={data.engagement.progress.total}
                            description={`${data.engagement.progress.completed} đã hoàn thành (${parseFloat(data.engagement.progress.completionRate).toFixed(1)}%)`}
                        />
                        <MetricCard
                            title='Tổng thông báo'
                            value={data.engagement.notifications.total}
                            description={`${data.engagement.notifications.unread} chưa đọc`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Transaction Stats */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thống kê giao dịch</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <MetricCard
                            title='Tổng giao dịch'
                            value={data.transactions.total}
                            description={`${data.transactions.successful} giao dịch thành công`}
                        />
                        <MetricCard
                            title='Tỷ lệ thành công'
                            value={`${parseFloat(data.transactions.successRate).toFixed(1)}%`}
                            description='Tỷ lệ giao dịch thành công'
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

