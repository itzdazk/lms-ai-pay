import {
    formatNotificationTime,
    getNotificationTypeConfig,
    getNotificationRoute,
} from '../../lib/notificationUtils'
import type { Notification } from '../../lib/api/types'
import { cn } from '../ui/utils'
import { useNavigate } from 'react-router-dom'

export interface NotificationItemProps {
    notification: Notification
    onMarkAsRead?: (id: number) => void
    onDelete?: (id: number) => void
    compact?: boolean
    clickable?: boolean // Cho phép tắt click nếu cần
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    compact = false,
    clickable = false, // Mặc định vô hiệu hóa navigation
}: NotificationItemProps) {
    const navigate = useNavigate()
    const config = getNotificationTypeConfig(notification.type)
    const Icon = config.icon
    const isUnread = !notification.isRead
    const route = getNotificationRoute(notification)

    const handleClick = () => {
        console.log('[NotificationItem] Click detected:', {
            notificationId: notification.id,
            clickable,
            route,
            isRead: notification.isRead,
        })

        // Đánh dấu đã đọc (luôn thực hiện khi click)
        if (onMarkAsRead && !notification.isRead) {
            console.log('[NotificationItem] Marking as read:', notification.id)
            onMarkAsRead(notification.id)
        }

        // Navigate chỉ khi clickable = true
        if (clickable && route) {
            console.log('[NotificationItem] Navigating to:', route)
            navigate(route)
        } else {
            console.log('[NotificationItem] Navigation blocked:', {
                clickable,
                route,
            })
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDelete) {
            onDelete(notification.id)
        }
    }

    return (
        <div
            className={cn(
                'flex gap-3 p-4 transition-colors',
                'cursor-pointer', // Luôn cho phép click để đánh dấu đã đọc
                isUnread ? 'bg-blue-950/20' : 'bg-transparent',
                isUnread && 'hover:bg-blue-950/30', // Hover effect cho unread
                compact && 'p-3'
            )}
            onClick={handleClick}
        >
            <div
                className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    config.bgColor,
                    compact && 'w-8 h-8'
                )}
            >
                <Icon
                    className={cn(
                        'w-5 h-5',
                        config.iconColor,
                        compact && 'w-4 h-4'
                    )}
                />
            </div>
            <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                    <h4
                        className={cn(
                            'text-sm font-semibold text-white line-clamp-2',
                            isUnread && 'font-bold',
                            compact && 'text-xs'
                        )}
                    >
                        {notification.title}
                    </h4>
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className='flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1'
                            aria-label='Xóa thông báo'
                        >
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </button>
                    )}
                </div>
                <p
                    className={cn(
                        'text-sm text-gray-400 mt-1 line-clamp-2',
                        compact && 'text-xs line-clamp-1'
                    )}
                >
                    {notification.message}
                </p>
                <p className='text-xs text-gray-500 mt-2'>
                    {formatNotificationTime(notification.createdAt)}
                </p>
            </div>
        </div>
    )
}
