import { Loader2, Info, BarChart3, Timer, AlertCircle, Target, ThumbsUp, ThumbsDown, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import type { ConversationStats } from './types'

interface ConversationStatsPanelProps {
    stats: ConversationStats | null
    loading: boolean
    formatTime: (ms: number) => string
}

export function ConversationStatsPanel({
    stats,
    loading,
    formatTime,
}: ConversationStatsPanelProps) {
    if (loading) {
        return (
            <div className='p-4 flex items-center justify-center h-full'>
                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className='p-4 text-center text-gray-400'>
                <Info className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>Chưa có dữ liệu thống kê</p>
            </div>
        )
    }

    const formatDurationMs = (ms: number) => {
        if (ms < 60000) return `${Math.round(ms / 1000)}s`
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.round((ms % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }

    return (
        <div className='p-3 space-y-3'>
            <div className='flex items-center gap-2 mb-3'>
                <BarChart3 className='h-5 w-5 text-purple-400' />
                <h3 className='text-lg font-semibold text-white'>Thống kê chi tiết</h3>
            </div>

            {/* Overview Stats */}
            <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                <CardHeader className='pb-2'>
                    <CardTitle className='text-sm text-gray-400'>Tổng quan</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>Tổng tin nhắn</span>
                        <span className='text-lg font-bold text-white'>{stats.totalMessages}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>Người dùng</span>
                        <span className='text-sm font-semibold text-blue-400'>{stats.userMessages}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>AI</span>
                        <span className='text-sm font-semibold text-purple-400'>{stats.aiMessages}</span>
                    </div>
                    {stats.duration > 0 && (
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-400'>Thời lượng</span>
                            <span className='text-sm text-white'>{formatDurationMs(stats.duration)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                <CardHeader className='pb-2'>
                    <CardTitle className='text-sm text-gray-400 flex items-center gap-2'>
                        <Timer className='h-4 w-4' />
                        Hiệu suất
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>Thời gian phản hồi TB</span>
                        <span className='text-sm font-semibold text-green-400'>
                            {formatTime(stats.avgResponseTime)}
                        </span>
                    </div>
                    {stats.fallbackCount > 0 && (
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-400'>Số lần fallback</span>
                            <span className='text-sm font-semibold text-orange-400 flex items-center gap-1'>
                                <AlertCircle className='h-3 w-3' />
                                {stats.fallbackCount}
                            </span>
                        </div>
                    )}
                    {stats.totalSources > 0 && (
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-400'>Khóa học đề xuất</span>
                            <span className='text-sm font-semibold text-yellow-400'>
                                {stats.totalSources}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feedback Stats */}
            {(stats.helpfulCount > 0 || stats.notHelpfulCount > 0) && (
                <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm text-gray-400 flex items-center gap-2'>
                            <Target className='h-4 w-4' />
                            Đánh giá
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-400 flex items-center gap-1'>
                                <ThumbsUp className='h-3 w-3 text-green-400' />
                                Hữu ích
                            </span>
                            <span className='text-sm font-semibold text-green-400'>
                                {stats.helpfulCount}
                            </span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-400 flex items-center gap-1'>
                                <ThumbsDown className='h-3 w-3 text-red-400' />
                                Không hữu ích
                            </span>
                            <span className='text-sm font-semibold text-red-400'>
                                {stats.notHelpfulCount}
                            </span>
                        </div>
                        {stats.feedbackRate > 0 && (
                            <div className='flex items-center justify-between pt-2 border-t border-[#2D2D2D]'>
                                <span className='text-sm text-gray-400'>Tỷ lệ phản hồi</span>
                                <span className='text-sm font-semibold text-white'>
                                    {stats.feedbackRate?.toFixed(1) || 0}%
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Timeline */}
            {stats.firstMessageAt && stats.lastMessageAt && (
                <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm text-gray-400 flex items-center gap-2'>
                            <Clock className='h-4 w-4' />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-1.5 text-xs text-gray-400'>
                        <div>
                            <span className='text-gray-500'>Bắt đầu:</span>
                            <div className='text-white mt-1'>
                                {new Date(stats.firstMessageAt).toLocaleString('vi-VN')}
                            </div>
                        </div>
                        <div>
                            <span className='text-gray-500'>Kết thúc:</span>
                            <div className='text-white mt-1'>
                                {new Date(stats.lastMessageAt).toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activity Distribution - Messages per hour */}
            {stats.messagesByHour && Object.keys(stats.messagesByHour).length > 0 && (
                <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm text-gray-400 flex items-center gap-2'>
                            <Activity className='h-4 w-4' />
                            Phân bố hoạt động theo giờ
                        </CardTitle>
                        <p className='text-xs text-gray-500 mt-1'>
                            Số lượng tin nhắn theo từng giờ trong ngày
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar'>
                            {Object.entries(stats.messagesByHour)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([hour, count]: [string, any]) => (
                                    <div key={hour} className='flex items-center justify-between text-xs'>
                                        <span className='text-gray-400'>
                                            {new Date(hour).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        <div className='flex items-center gap-2'>
                                            <div className='w-24 h-2 bg-[#2D2D2D] rounded-full overflow-hidden'>
                                                <div
                                                    className='h-full bg-purple-500'
                                                    style={{
                                                        width: `${(count / stats.totalMessages) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className='text-white font-semibold w-8 text-right'>
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
