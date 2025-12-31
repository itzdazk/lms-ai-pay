import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

interface StudyTimeAnalytics {
    totals: {
        today: number
        thisWeek: number
        thisMonth: number
        allTime: number
    }
    formatted: {
        today: string
        thisWeek: string
        thisMonth: string
        allTime: string
    }
    dailyAverage: number
    byCourse: Array<{
        courseId: number
        courseTitle: string
        studyTime: number
        formatted: string
        percentage: number
    }>
    trend: Array<{
        date: string
        studyTime: number
        formatted: string
    }>
}

export function useStudyTime() {
    const [analytics, setAnalytics] = useState<StudyTimeAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudyTimeAnalytics()
                setAnalytics(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load study time analytics')
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    return {
        analytics,
        loading,
        error,
    }
}
