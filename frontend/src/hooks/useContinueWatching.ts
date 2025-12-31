import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

export function useContinueWatching(limit?: number) {
    const [lessons, setLessons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudentContinueWatching(
                    limit
                )
                setLessons(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load continue watching')
            } finally {
                setLoading(false)
            }
        }

        fetchLessons()
    }, [limit])

    return {
        lessons,
        loading,
        error,
    }
}
