import { useCallback, useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi } from '../lib/api/instructor-dashboard'
import type { Student } from '../lib/api/instructor-dashboard'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface InstructorStudentsFilters {
    page?: number
    limit?: number
    search?: string
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
 * Hook: fetch instructor students list with pagination and search
 */
export function useInstructorStudents(filters?: InstructorStudentsFilters) {
    const [students, setStudents] = useState<Student[]>([])
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
        [filters?.page, filters?.limit, filters?.search]
    )

    const fetchStudents = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorStudents(
                memoizedFilters
            )
            setStudents(data.students)
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
        fetchStudents()
    }, [fetchStudents])

    return {
        students,
        pagination,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchStudents,
    }
}
