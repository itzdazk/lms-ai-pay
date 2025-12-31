import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Notification } from '../lib/api'
import { notificationsApi } from '../lib/api/notifications'
import type { GetNotificationsParams } from '../lib/api/notifications'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

const parseErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
        const anyError = error as any
        const message =
            anyError?.response?.data?.message ||
            anyError?.message ||
            'Đã xảy ra lỗi'
        return typeof message === 'string' ? message : 'Đã xảy ra lỗi'
    }
    if (typeof error === 'string') return error
    return 'Đã xảy ra lỗi'
}

export interface UseNotificationsOptions {
    page?: number
    limit?: number
    isRead?: boolean
    autoRefresh?: boolean
    refreshInterval?: number
}

export function useNotifications(options?: UseNotificationsOptions) {
    const {
        page = 1,
        limit = 20,
        isRead,
        autoRefresh = false,
        refreshInterval = 30000, // 30 seconds
    } = options || {}

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [total, setTotal] = useState<number>(0)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchNotifications = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const params: GetNotificationsParams = {
                page,
                limit,
            }
            if (isRead !== undefined) {
                params.isRead = isRead
            }

            const data = await notificationsApi.getNotifications(params)
            setNotifications(data.items)
            setTotal(data.total)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            // Don't show toast for auto-refresh errors
            if (!autoRefresh) {
                toast.error(message)
            }
        }
    }, [page, limit, isRead, autoRefresh])

    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationsApi.getUnreadCount()
            setUnreadCount(count)
        } catch (err) {
            // Silently fail for unread count
            console.error('Failed to fetch unread count:', err)
        }
    }, [])

    const refetch = useCallback(async () => {
        await Promise.all([fetchNotifications(), fetchUnreadCount()])
    }, [fetchNotifications, fetchUnreadCount])

    // Initial fetch
    useEffect(() => {
        refetch()
    }, [refetch])

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refetch()
            }
        }, refreshInterval)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval, refetch])

    // Visibility change handler
    useEffect(() => {
        if (!autoRefresh) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refetch()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            )
        }
    }, [autoRefresh, refetch])

    const markAsRead = useCallback(
        async (id: number) => {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))

            try {
                await notificationsApi.markAsRead(id)
                // Refetch to ensure consistency
                await fetchUnreadCount()
            } catch (err) {
                // Revert on error
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
                )
                setUnreadCount((prev) => prev + 1)
                const message = parseErrorMessage(err)
                toast.error(message || 'Không thể đánh dấu đã đọc')
            }
        },
        [fetchUnreadCount]
    )

    const markAllAsRead = useCallback(async () => {
        // Optimistic update - cập nhật ngay lập tức
        const previousUnreadCount = unreadCount
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)

        try {
            const updated = await notificationsApi.markAllAsRead()
            toast.success(`Đã đánh dấu ${updated} thông báo là đã đọc`)
            await fetchUnreadCount()
        } catch (err) {
            // Revert on error
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: false }))
            )
            setUnreadCount(previousUnreadCount)
            const message = parseErrorMessage(err)
            toast.error(message || 'Không thể đánh dấu tất cả đã đọc')
        }
    }, [unreadCount, fetchUnreadCount])

    const deleteNotification = useCallback(
        async (id: number) => {
            const notification = notifications.find((n) => n.id === id)
            const wasUnread = notification && !notification.isRead

            // Optimistic update
            setNotifications((prev) => prev.filter((n) => n.id !== id))
            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1))
            }

            try {
                await notificationsApi.deleteNotification(id)
                await fetchUnreadCount()
            } catch (err) {
                // Revert on error
                if (notification) {
                    setNotifications((prev) =>
                        [...prev, notification].sort(
                            (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                        )
                    )
                }
                if (wasUnread) {
                    setUnreadCount((prev) => prev + 1)
                }
                const message = parseErrorMessage(err)
                toast.error(message || 'Không thể xóa thông báo')
            }
        },
        [notifications, fetchUnreadCount]
    )

    const clearAll = useCallback(async () => {
        try {
            await notificationsApi.clearAllNotifications()
            setNotifications([])
            setUnreadCount(0)
            setTotal(0)
            toast.success('Đã xóa tất cả thông báo')
        } catch (err) {
            const message = parseErrorMessage(err)
            toast.error(message || 'Không thể xóa tất cả thông báo')
        }
    }, [])

    return useMemo(
        () => ({
            notifications,
            unreadCount,
            total,
            page,
            limit,
            isLoading: status === 'loading',
            isError: status === 'error',
            error,
            refetch,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll,
        }),
        [
            notifications,
            unreadCount,
            total,
            page,
            limit,
            status,
            error,
            refetch,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll,
        ]
    )
}

/**
 * Hook: fetch only unread count (lightweight for bell badge)
 */
export function useUnreadCount(autoRefresh = true) {
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationsApi.getUnreadCount()
            setUnreadCount(count)
            setIsLoading(false)
        } catch (err) {
            console.error('Failed to fetch unread count:', err)
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUnreadCount()
    }, [fetchUnreadCount])

    // Auto-refresh logic
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchUnreadCount()
            }
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [autoRefresh, fetchUnreadCount])

    // Visibility change handler
    useEffect(() => {
        if (!autoRefresh) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchUnreadCount()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            )
        }
    }, [autoRefresh, fetchUnreadCount])

    return {
        unreadCount,
        isLoading,
        refetch: fetchUnreadCount,
    }
}
