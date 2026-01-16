import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { instructorDashboardApi, type CourseRevenueData } from '../lib/api/instructor-dashboard'

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
 * Hook: fetch instructor revenue grouped by courses (optimized)
 */
export function useInstructorRevenueByCourses(params?: {
    year?: number
    month?: number | null
    courseId?: number | null
    page?: number
    limit?: number
}) {
    const [courses, setCourses] = useState<CourseRevenueData[]>([])
    const [totalRevenue, setTotalRevenue] = useState<number>(0)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    // Extract primitive values for stable dependency comparison
    const year = params?.year ?? new Date().getFullYear()
    const month = params?.month ?? null
    const courseId = params?.courseId ?? null
    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const fetchCourses = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await instructorDashboardApi.getInstructorRevenueByCourses({
                year,
                month,
                courseId,
                page,
                limit,
            })
            setCourses(data.courses)
            setTotalRevenue(data.totalRevenue)
            setPagination(data.pagination)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [year, month, courseId, page, limit])

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    return {
        courses,
        totalRevenue,
        pagination,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchCourses,
    }
}
