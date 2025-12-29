import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi } from '../lib/api/instructor-dashboard'
import type { InstructorRevenueData } from '../lib/api/instructor-dashboard'

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
 * Hook: fetch instructor revenue data
 */
export function useInstructorRevenue(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
) {
    const [revenue, setRevenue] = useState<InstructorRevenueData | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchRevenue = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorRevenue(
                period
            )
            setRevenue(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [period])

    useEffect(() => {
        fetchRevenue()
    }, [fetchRevenue])

    return {
        revenue,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchRevenue,
    }
}
