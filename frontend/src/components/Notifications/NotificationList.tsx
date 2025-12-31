import { NotificationItem } from './NotificationItem'
import { EmptyNotifications } from './EmptyNotifications'
import type { Notification } from '../../lib/api'

export interface NotificationListProps {
    notifications: Notification[]
    onMarkAsRead?: (id: number) => void
    onDelete?: (id: number) => void
    compact?: boolean
    emptyType?: 'empty' | 'no-unread'
    clickable?: boolean // Cho phép tắt click cho toàn bộ list
}

export function NotificationList({
    notifications,
    onMarkAsRead,
    onDelete,
    compact = false,
    emptyType = 'empty',
    clickable = true, // Mặc định là clickable
}: NotificationListProps) {
    if (notifications.length === 0) {
        return <EmptyNotifications type={emptyType} />
    }

    return (
        <div className='divide-y divide-gray-800'>
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    compact={compact}
                    clickable={clickable}
                />
            ))}
        </div>
    )
}
