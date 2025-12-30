import { useCallback, useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi } from '../lib/api/instructor-dashboard'
import type { Enrollment } from '../lib/api/types'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface InstructorEnrollmentsFilters {
    page?: number
    limit?: number
    search?: string
    courseId?: number
    status?: string
    startDate?: string
    endDate?: string
    sort?: string
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
 * Hook: fetch instructor enrollments list with filters and pagination
 */
export function useInstructorEnrollments(
    filters?: InstructorEnrollmentsFilters
) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    // Memoize filters to prevent unnecessary re-renders
    const memoizedFilters = useMemo(
        () => filters,
        [
            filters?.page,
            filters?.limit,
            filters?.search,
            filters?.courseId,
            filters?.status,
            filters?.startDate,
            filters?.endDate,
            filters?.sort,
        ]
    )

    const fetchEnrollments = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorEnrollments(
                memoizedFilters
            )
            setEnrollments(data.enrollments)
            setPagination(data.pagination)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            // Only show toast for non-429 errors (rate limiting)
            if (
                err &&
                typeof err === 'object' &&
                (err as any).response?.status !== 429
            ) {
                toast.error(message)
            }
        }
    }, [memoizedFilters])

    useEffect(() => {
        fetchEnrollments()
    }, [fetchEnrollments])

    return {
        enrollments,
        pagination,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchEnrollments,
    }
}
