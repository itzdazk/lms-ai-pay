import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

export function useEnrolledCourses(limit?: number) {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudentEnrolledCourses(limit)
                setCourses(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load enrolled courses')
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [limit])

    return {
        courses,
        loading,
        error,
    }
}
