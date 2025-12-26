import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { dashboardApi } from '../lib/api/dashboard'
import type { Enrollment } from '../lib/api/types'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export type InstructorEnrollmentFilters = {
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
    filters?: InstructorEnrollmentFilters
) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchEnrollments = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await dashboardApi.getInstructorEnrollments(filters)
            setEnrollments(data.enrollments)
            setPagination(data.pagination)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [filters])

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
