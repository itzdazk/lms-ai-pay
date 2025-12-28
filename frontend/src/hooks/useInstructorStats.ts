import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi } from '../lib/api/instructor-dashboard'
import type { InstructorStats } from '../lib/api/instructor-dashboard'

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

/**
 * Hook: fetch instructor statistics
 */
export function useInstructorStats(options?: { autoRefresh?: boolean }) {
    const [stats, setStats] = useState<InstructorStats | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorStats()
            setStats(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            // Don't show toast for auto-refresh failures
            if (!options?.autoRefresh) {
                toast.error(message)
            }
        }
    }, [options?.autoRefresh])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    // Auto-refresh every 5 minutes if enabled
    useEffect(() => {
        if (!options?.autoRefresh) return

        const interval = setInterval(() => {
            fetchStats()
        }, 5 * 60 * 1000) // 5 minutes

        return () => clearInterval(interval)
    }, [options?.autoRefresh, fetchStats])

    return {
        stats,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchStats,
    }
}
