import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi } from '../lib/api/instructor-dashboard'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

type ChartDataItem = {
    period: string | number
    periodLabel: string
    revenue: number
    date: string
}

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
 * Hook: fetch instructor revenue chart data (grouped by month or day)
 */
export function useInstructorRevenueChartData(params?: {
    year?: number
    month?: number | null
    courseId?: number | null
}) {
    const [chartData, setChartData] = useState<ChartDataItem[]>([])
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    // Extract primitive values for stable dependency comparison
    const year = params?.year ?? new Date().getFullYear()
    const month = params?.month ?? null
    const courseId = params?.courseId ?? null

    const fetchChartData = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorRevenueChartData({
                year,
                month,
                courseId,
            })
            setChartData(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [year, month, courseId])

    useEffect(() => {
        fetchChartData()
    }, [fetchChartData])

    return {
        chartData,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchChartData,
    }
}
