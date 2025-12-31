import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, Clock } from 'lucide-react'
import { useRecentActivities } from '../../hooks/useRecentActivities'
import {
    formatActivityMessage,
    formatRelativeTime,
    getActivityIcon,
    type Activity,
} from '../../lib/dashboardUtils'

export function RecentActivities() {
    const { activities, loading, error, hasMore, loadMore } =
        useRecentActivities({
            limit: 10,
        })

    if (loading && activities.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (activities.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-gray-400 text-sm'>
                        Chưa có hoạt động nào gần đây
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {activities.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                ))}
                {hasMore && (
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className='w-full text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50'
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                )}
            </CardContent>
        </Card>
    )
}

function ActivityItem({ activity }: { activity: Activity }) {
    const icon = getActivityIcon(activity.type)
    const message = formatActivityMessage(activity)
    const relativeTime = formatRelativeTime(activity.timestamp)

    const getBadgeColor = () => {
        switch (activity.type) {
            case 'ENROLLMENT':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'LESSON_COMPLETED':
                return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'QUIZ_SUBMITTED':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }
    }

    return (
        <div className='flex gap-3 p-3 rounded-lg border border-[#2D2D2D] bg-black/40 hover:bg-black/60 transition-colors'>
            <div className='text-2xl'>{icon}</div>
            <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                    <Badge className={`text-xs ${getBadgeColor()}`}>
                        {activity.type === 'ENROLLMENT'
                            ? 'Đăng ký'
                            : activity.type === 'LESSON_COMPLETED'
                            ? 'Hoàn thành'
                            : 'Quiz'}
                    </Badge>
                    <span className='text-xs text-gray-500 flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {relativeTime}
                    </span>
                </div>
                <p className='text-sm text-white'>{message}</p>
                {activity.course && (
                    <Link
                        to={`/courses/${activity.course.slug}`}
                        className='text-xs text-blue-400 hover:text-blue-300 mt-1 block'
                    >
                        {activity.course.title}
                    </Link>
                )}
            </div>
        </div>
    )
}
