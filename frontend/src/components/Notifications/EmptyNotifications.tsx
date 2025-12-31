import { Bell, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'

export interface EmptyNotificationsProps {
    type: 'empty' | 'no-unread'
}

export function EmptyNotifications({ type }: EmptyNotificationsProps) {
    if (type === 'empty') {
        return (
            <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
                <div className='w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4'>
                    <Bell className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-white mb-2'>
                    Chưa có thông báo nào
                </h3>
                <p className='text-sm text-gray-400 max-w-md'>
                    Các thông báo quan trọng sẽ xuất hiện ở đây
                </p>
            </div>
        )
    }

    return (
        <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
            <div className='w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center mb-4'>
                <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>
                Bạn đã đọc hết thông báo
            </h3>
            <p className='text-sm text-gray-400 mb-4 max-w-md'>
                Tất cả thông báo của bạn đã được đánh dấu là đã đọc
            </p>
            <Button variant='outline' asChild>
                <Link to='/notifications'>Xem tất cả thông báo</Link>
            </Button>
        </div>
    )
}

