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
export function useInstructorRevenue(params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    courseId?: number | null
    year?: number
    month?: number | null
}) {
    const [revenue, setRevenue] = useState<InstructorRevenueData | null>(null)
    const [status, setStatus] = useState<FetchStatus>('loading')
    const [error, setError] = useState<string | null>(null)

    // Extract primitive values for stable dependency comparison
    const period = params?.period ?? 'month'
    const courseId = params?.courseId ?? null
    const year = params?.year ?? new Date().getFullYear()
    const month = params?.month ?? null

    // Create a stable dependency string
    const deps = `${period}|${courseId}|${year}|${month}`

    useEffect(() => {
        let isCancelled = false

        const fetchRevenue = async () => {
            setStatus('loading')
            setError(null)
            try {
                const requestParams = {
                    period: period as 'day' | 'week' | 'month' | 'year',
                    courseId: courseId,
                    year: year,
                    month: month,
                }
                const data = await instructorDashboardApi.getInstructorRevenue(
                    requestParams
                )
                
                if (!isCancelled) {
                    setRevenue(data)
                    setStatus('success')
                }
            } catch (err) {
                if (!isCancelled) {
                    const message = parseErrorMessage(err)
                    setError(message)
                    setStatus('error')
                    toast.error(message)
                }
            }
        }

        fetchRevenue()

        return () => {
            isCancelled = true
        }
        // Use deps string for stable comparison
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deps])

    const refetch = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const requestParams = {
                period: period as 'day' | 'week' | 'month' | 'year',
                courseId: courseId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            }
            const data = await instructorDashboardApi.getInstructorRevenue(
                requestParams
            )
            setRevenue(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deps])

    return {
        revenue,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch,
    }
}
