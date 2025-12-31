import { useState, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu'
import {
    NotificationDropdown,
    NotificationDropdownRef,
} from './NotificationDropdown'
import { useUnreadCount } from '../../hooks/useNotifications'

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const { unreadCount, isLoading, refetch } = useUnreadCount(true)
    const [localUnreadCount, setLocalUnreadCount] = useState<number | null>(
        null
    )
    const dropdownRef = useRef<NotificationDropdownRef>(null)

    const displayCount =
        localUnreadCount !== null ? localUnreadCount : unreadCount

    // Refetch when dropdown opens
    const handleOpenChange = useCallback(
        (open: boolean) => {
            setIsOpen(open)

            // When opening dropdown, refetch to get latest data
            if (open) {
                console.log('Dropdown opened, refetching notifications...')
                // Refetch unread count
                refetch()
                // Refetch notification list
                dropdownRef.current?.refetch()
            }
        },
        [refetch]
    )

    // BEST FIX: Nhận Promise từ Dropdown để đợi API hoàn thành
    const handleUnreadCountChange = async (
        count: number,
        actionPromise?: Promise<any>
    ) => {
        // Cập nhật ngay lập tức (optimistic update)
        setLocalUnreadCount(count)

        // Nếu có actionPromise, đợi nó hoàn thành trước khi refetch
        if (actionPromise) {
            try {
                await actionPromise // Đợi API markAsRead/markAllAsRead hoàn thành
            } catch (error) {
                // Nếu API fail, revert lại
                setLocalUnreadCount(null)
                return
            }
        }

        // Sau khi API hoàn thành, refetch để sync với server
        refetch()
            .then(() => {
                // Delay nhỏ để tránh flicker
                setTimeout(() => {
                    setLocalUnreadCount(null)
                }, 100)
            })
            .catch(() => {
                // Nếu refetch fail, vẫn giữ local count
            })
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='ghost'
                    size='icon'
                    className='relative text-white hover:bg-[#1F1F1F]'
                    aria-label={`Thông báo, ${displayCount} chưa đọc`}
                    aria-expanded={isOpen}
                >
                    <Bell className='h-5 w-5' />
                    {displayCount > 0 && !isLoading && (
                        <Badge
                            className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600'
                            aria-label={`${displayCount} thông báo chưa đọc`}
                        >
                            {displayCount > 99 ? '99+' : displayCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <NotificationDropdown
                ref={dropdownRef}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUnreadCountChange={handleUnreadCountChange}
            />
        </DropdownMenu>
    )
}
