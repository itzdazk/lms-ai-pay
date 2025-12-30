import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

export function useLearningStreak() {
    const [streak, setStreak] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStreak = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getLearningStreak()
                setStreak(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load learning streak')
            } finally {
                setLoading(false)
            }
        }

        fetchStreak()
    }, [])

    return {
        streak,
        loading,
        error,
    }
}
