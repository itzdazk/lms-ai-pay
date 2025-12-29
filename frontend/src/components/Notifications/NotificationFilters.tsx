import { Button } from '../ui/button'
import { cn } from '../ui/utils'

export interface NotificationFiltersProps {
    activeFilter: 'all' | 'unread'
    unreadCount: number
    totalCount: number
    onChange: (filter: 'all' | 'unread') => void
}

export function NotificationFilters({
    activeFilter,
    unreadCount,
    totalCount,
    onChange,
}: NotificationFiltersProps) {
    return (
        <div className='flex gap-2 border-b border-gray-800 pb-4'>
            <Button
                variant={activeFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => onChange('all')}
                className={cn(
                    'rounded-full',
                    activeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                )}
            >
                Tất cả ({totalCount})
            </Button>
            <Button
                variant={activeFilter === 'unread' ? 'default' : 'ghost'}
                onClick={() => onChange('unread')}
                className={cn(
                    'rounded-full',
                    activeFilter === 'unread'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                )}
            >
                Chưa đọc ({unreadCount})
            </Button>
        </div>
    )
}

