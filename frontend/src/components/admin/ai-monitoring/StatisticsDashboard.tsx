import { Card, CardContent } from '../../../components/ui/card'
import { MessageSquare, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import type { AIStats } from './types'

interface StatisticsDashboardProps {
    stats: AIStats | null
    formatTime: (ms: number) => string
}

export function StatisticsDashboard({ stats, formatTime }: StatisticsDashboardProps) {
    if (!stats) return null

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-2'>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng cuộc trò chuyện</p>
                            <p className='text-xl font-bold text-white'>{stats.totalConversations}</p>
                        </div>
                        <MessageSquare className='h-8 w-8 text-purple-400 opacity-50' />
                    </div>
                    <div className='mt-1.5 flex items-center gap-2 text-xs'>
                        <span className='text-gray-500'>Trợ lý: {stats.byMode.advisor || 0}</span>
                        <span className='text-gray-500'>•</span>
                        <span className='text-gray-500'>Gia sư: {(stats.byMode.general || 0) + (stats.byMode.course || 0)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng tin nhắn</p>
                            <p className='text-xl font-bold text-white'>{stats.totalMessages}</p>
                        </div>
                        <Activity className='h-7 w-7 text-blue-400 opacity-50' />
                    </div>
                    <div className='mt-1.5 text-xs text-gray-500'>
                        {stats.uniqueUsers} người dùng
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Thời gian phản hồi TB</p>
                            <p className='text-xl font-bold text-white'>
                                {formatTime(stats.avgResponseTime)}
                            </p>
                        </div>
                        <Clock className='h-7 w-7 text-green-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Hoạt động 7 ngày</p>
                            <p className='text-xl font-bold text-white'>{stats.recentConversations}</p>
                        </div>
                        <TrendingUp className='h-7 w-7 text-yellow-400 opacity-50' />
                    </div>
                    {stats.fallbackCount > 0 && (
                        <div className='mt-1.5 text-xs text-orange-400 flex items-center gap-1'>
                            <AlertCircle className='h-3 w-3' />
                            {stats.fallbackCount} fallback
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
