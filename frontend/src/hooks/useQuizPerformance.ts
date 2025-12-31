import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'

interface QuizPerformance {
    overall: {
        totalQuizzes: number
        averageScore: number
        passRate: number
        perfectScores: number
        totalAttempts: number
    }
    recentQuizzes: Array<{
        id: number
        quizTitle: string
        courseTitle: string
        score: number
        passingScore: number
        isPassed: boolean
        submittedAt: string
    }>
    performanceTrend: Array<{
        date: string
        averageScore: number
    }>
    weakTopics: Array<{
        topic: string
        quizCount: number
        averageScore: number
    }>
}

export function useQuizPerformance() {
    const [performance, setPerformance] = useState<QuizPerformance | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getQuizPerformance()
                setPerformance(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load quiz performance')
            } finally {
                setLoading(false)
            }
        }

        fetchPerformance()
    }, [])

    return {
        performance,
        loading,
        error,
    }
}
