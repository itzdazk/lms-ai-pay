import { useState, useEffect, useCallback } from 'react'
import { instructorQuizzesApi } from '../lib/api/instructor-quizzes'
import type { Quiz } from '../lib/api/types'

/**
 * Hook to fetch a single quiz by ID
 * Usage:
 *   const { quiz, loading, error, refetch } = useQuiz(quizId)
 */
export function useQuiz(quizId?: number) {
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [loading, setLoading] = useState(!quizId)
    const [error, setError] = useState<Error | null>(null)

    const fetchQuiz = useCallback(async () => {
        if (!quizId) {
            setLoading(false)
            setQuiz(null)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = await instructorQuizzesApi.getQuiz(quizId)
            setQuiz(data)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch quiz')
            setError(error)
            console.error('Error fetching quiz:', error)
        } finally {
            setLoading(false)
        }
    }, [quizId])

    useEffect(() => {
        fetchQuiz()
    }, [fetchQuiz])

    const refetch = useCallback(async () => {
        await fetchQuiz()
    }, [fetchQuiz])

    return {
        quiz,
        loading,
        error,
        refetch,
    }
}
