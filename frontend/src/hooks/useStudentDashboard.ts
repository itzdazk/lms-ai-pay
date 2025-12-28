import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

export function useStudentDashboard() {
    const [dashboard, setDashboard] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudentDashboard()
                setDashboard(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    return {
        dashboard,
        loading,
        error,
        refetch: async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getStudentDashboard()
                setDashboard(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard')
            } finally {
                setLoading(false)
            }
        },
    }
}
