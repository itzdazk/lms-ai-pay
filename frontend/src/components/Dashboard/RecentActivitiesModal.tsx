import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Loader2, Clock } from 'lucide-react'
import { useRecentActivities } from '../../hooks/useRecentActivities'
import {
    formatActivityMessage,
    formatRelativeTime,
    type Activity,
} from '../../lib/dashboardUtils'
import { Link } from 'react-router-dom'

interface RecentActivitiesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RecentActivitiesModal({
    open,
    onOpenChange,
}: RecentActivitiesModalProps) {
    const { activities, loading, error, hasMore, loadMore } =
        useRecentActivities({
            limit: 20,
        })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col [&>button]:text-white'>
                <DialogHeader>
                    <DialogTitle className='text-white text-2xl'>
                        Hoạt động gần đây
                    </DialogTitle>
                </DialogHeader>
                <div className='flex-1 overflow-y-auto pr-2'>
                    {loading && activities.length === 0 ? (
                        <div className='flex items-center justify-center py-12'>
                            <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                        </div>
                    ) : error ? (
                        <p className='text-red-400 text-sm py-8'>{error}</p>
                    ) : activities.length === 0 ? (
                        <p className='text-gray-400 text-sm py-8 text-center'>
                            Chưa có hoạt động nào gần đây
                        </p>
                    ) : (
                        <div className='space-y-3'>
                            {activities.map((activity, index) => (
                                <ActivityItem key={index} activity={activity} />
                            ))}
                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className='w-full text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 py-2'
                                >
                                    {loading ? 'Đang tải...' : 'Xem thêm'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ActivityItem({ activity }: { activity: Activity }) {
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activity.course.title}
                    </Link>
                )}
            </div>
        </div>
    )
}
