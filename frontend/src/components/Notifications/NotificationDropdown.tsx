import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DropdownMenuContent, DropdownMenuLabel } from '../ui/dropdown-menu'
import { NotificationList } from './NotificationList'
import { useNotifications } from '../../hooks/useNotifications'
import { Loader2 } from 'lucide-react'

export interface NotificationDropdownProps {
    isOpen: boolean
    onClose: () => void
    onUnreadCountChange: (count: number, actionPromise?: Promise<any>) => void
}

export function NotificationDropdown({
    isOpen,
    onClose,
    onUnreadCountChange,
}: NotificationDropdownProps) {
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
        useNotifications({
            limit: 3,
            autoRefresh: false,
        })

    const handleMarkAllAsRead = async () => {
        // Tạo Promise cho action
        const actionPromise = markAllAsRead()

        // Cập nhật ngay lập tức và truyền Promise cho parent
        onUnreadCountChange(0, actionPromise)
    }

    const handleMarkAsRead = async (id: number) => {
        const newCount = Math.max(0, unreadCount - 1)

        // Tạo Promise cho action
        const actionPromise = markAsRead(id)

        // Cập nhật ngay lập tức và truyền Promise cho parent
        onUnreadCountChange(newCount, actionPromise)
    }

    return (
        <DropdownMenuContent
            align='end'
            className='w-[480px] max-w-[90vw] bg-[#1A1A1A] border-[#2D2D2D] p-0'
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
            <div className='p-4 border-b border-[#2D2D2D]'>
                <div className='flex items-center justify-between'>
                    <DropdownMenuLabel className='text-white flex items-center gap-2'>
                        <span>Thông báo</span>
                        {unreadCount > 0 && (
                            <Badge className='bg-blue-600 text-white'>
                                {unreadCount} mới
                            </Badge>
                        )}
                    </DropdownMenuLabel>
                </div>
            </div>

            <div>
                {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                    </div>
                ) : (
                    <NotificationList
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                        compact={true}
                        emptyType='empty'
                        clickable={true}
                    />
                )}
            </div>

            <div className='p-4 border-t border-[#2D2D2D] flex items-center justify-between gap-2'>
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0 || isLoading}
                    className='text-white hover:bg-[#252525]'
                >
                    Đánh dấu tất cả đã đọc
                </Button>
                <Button
                    variant='ghost'
                    size='sm'
                    asChild
                    className='text-white hover:bg-[#252525]'
                >
                    <Link to='/notifications' onClick={onClose}>
                        Xem tất cả →
                    </Link>
                </Button>
            </div>
        </DropdownMenuContent>
    )
}
