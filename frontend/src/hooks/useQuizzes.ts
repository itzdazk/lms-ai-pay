import { useState, useEffect, useCallback } from 'react'
import { instructorQuizzesApi } from '../lib/api/instructor-quizzes'
import type { Quiz } from '../lib/api/types'

/**
 * Hook to fetch all quizzes for a lesson
 * Usage:
 *   const { quizzes, loading, error, refetch } = useQuizzes(lessonId)
 */
export function useQuizzes(lessonId?: number) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchQuizzes = useCallback(async () => {
        if (!lessonId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = await instructorQuizzesApi.getQuizzes(lessonId)
            setQuizzes(data)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch quizzes')
            setError(error)
            console.error('Error fetching quizzes:', error)
        } finally {
            setLoading(false)
        }
    }, [lessonId])

    useEffect(() => {
        fetchQuizzes()
    }, [fetchQuizzes])

    const refetch = useCallback(async () => {
        await fetchQuizzes()
    }, [fetchQuizzes])

    return {
        quizzes,
        loading,
        error,
        refetch,
    }
}
