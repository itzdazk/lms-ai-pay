import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'
import type { Activity } from '../lib/dashboardUtils'

interface UseRecentActivitiesOptions {
    limit?: number
    type?: 'ENROLLMENT' | 'LESSON_COMPLETED' | 'QUIZ_SUBMITTED'
    dateFrom?: string
}

export function useRecentActivities(options?: UseRecentActivitiesOptions) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true)
                setError(null)
                const result = await dashboardApi.getRecentActivities(options)
                setActivities(result.activities)
                setHasMore(result.meta?.hasMore || false)
            } catch (err: any) {
                setError(err.message || 'Failed to load recent activities')
            } finally {
                setLoading(false)
            }
        }

        fetchActivities()
    }, [options?.limit, options?.type, options?.dateFrom])

    const loadMore = async () => {
        if (loading || !hasMore) return

        try {
            setLoading(true)
            const currentLimit = activities.length + (options?.limit || 10)
            const result = await dashboardApi.getRecentActivities({
                ...options,
                limit: currentLimit,
            })
            setActivities(result.activities)
            setHasMore(result.meta?.hasMore || false)
        } catch (err: any) {
            setError(err.message || 'Failed to load more activities')
        } finally {
            setLoading(false)
        }
    }

    return {
        activities,
        loading,
        error,
        hasMore,
        loadMore,
    }
}
