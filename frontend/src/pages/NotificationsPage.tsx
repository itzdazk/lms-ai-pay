import { useState, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { NotificationFilters } from '../components/Notifications/NotificationFilters'
import { NotificationList } from '../components/Notifications/NotificationList'
import { useNotifications } from '../hooks/useNotifications'
import { Loader2, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'

export function NotificationsPage() {
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
    const [page, setPage] = useState(1)
    const [showClearDialog, setShowClearDialog] = useState(false)

    const {
        notifications,
        unreadCount,
        total,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refetch,
    } = useNotifications({
        page,
        limit: 20,
        isRead: activeFilter === 'unread' ? false : undefined,
        autoRefresh: false,
    })

    const handleFilterChange = useCallback((filter: 'all' | 'unread') => {
        setActiveFilter(filter)
        setPage(1) // Reset to first page
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const handleClearAll = useCallback(async () => {
        await clearAll()
        setShowClearDialog(false)
        refetch()
    }, [clearAll, refetch])

    const totalPages = Math.ceil(total / 20)

    return (
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-black dark:text-white mb-2'>
                    Thông báo của tôi
                </h1>
                <p className='text-gray-500'>
                    Quản lý và xem tất cả thông báo của bạn
                </p>
            </div>

            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6'>
                <div className='mb-6'>
                    <NotificationFilters
                        activeFilter={activeFilter}
                        unreadCount={unreadCount}
                        totalCount={total}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className='mb-4 flex items-center justify-between'>
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0 || isLoading}
                        >
                            Đánh dấu tất cả đã đọc
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setShowClearDialog(true)}
                            disabled={notifications.length === 0 || isLoading}
                            className='text-red-600 hover:text-red-700 hover:bg-red-950/20'
                        >
                            <Trash2 className='w-4 h-4 mr-2' />
                            Xóa tất cả
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className='flex items-center justify-center py-12'>
                        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
                    </div>
                ) : (
                    <>
                        <NotificationList
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            emptyType={
                                activeFilter === 'unread'
                                    ? 'no-unread'
                                    : 'empty'
                            }
                            clickable={false}
                        />

                        {totalPages > 1 && (
                            <div className='mt-6 flex items-center justify-center gap-2'>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1 || isLoading}
                                >
                                    ← Trước
                                </Button>
                                <span className='text-sm text-gray-400 px-4'>
                                    Trang {page} / {totalPages}
                                </span>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages || isLoading}
                                >
                                    Sau →
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Clear All Confirmation Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa tất cả thông báo</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa tất cả thông báo? Hành
                            động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowClearDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button variant='destructive' onClick={handleClearAll}>
                            Xóa tất cả
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
