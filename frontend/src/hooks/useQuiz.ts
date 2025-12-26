import { useState, useEffect, useCallback } from 'react'
import { instructorQuizzesApi } from '../lib/api/instructor-quizzes'
import { quizzesApi } from '../lib/api/quizzes'
import type { Quiz, QuizResult, QuizAnswer, QuizAttempt } from '../lib/api/types'
import { toast } from 'sonner'

/**
 * Hook to fetch a single quiz by ID (for instructor)
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

/**
 * Hook for student quiz taking
 * Usage:
 *   const { quiz, loading, startQuiz, answerQuestion, submitQuiz, ... } = useQuizTaking()
 */
interface UseQuizTakingReturn {
    // State
    quiz: Quiz | null
    loading: boolean
    submitting: boolean
    error: string | null
    
    // Quiz taking state
    currentQuestionIndex: number
    answers: QuizAnswer[]
    timeRemaining: number | null // in seconds
    isTimeUp: boolean
    
    // Quiz results
    result: QuizResult | null
    attempt: QuizAttempt | null
    
    // Actions
    fetchQuiz: (quizId: string) => Promise<void>
    fetchAttempts: (quizId: string) => Promise<void>
    fetchLatestResult: (quizId: string) => Promise<void>
    startQuiz: () => void
    answerQuestion: (questionId: string, answer: string) => void
    goToQuestion: (index: number) => void
    nextQuestion: () => void
    previousQuestion: () => void
    submitQuiz: () => Promise<void>
    resetQuiz: () => void
}

export const useQuizTaking = (): UseQuizTakingReturn => {
    // State
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Quiz taking state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<QuizAnswer[]>([])
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [isTimeUp, setIsTimeUp] = useState(false)
    
    // Quiz results
    const [result, setResult] = useState<QuizResult | null>(null)
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
    
    // Fetch quiz data
    const fetchQuiz = useCallback(async (quizId: string) => {
        setLoading(true)
        setError(null)
        try {
            const quizData = await quizzesApi.getQuizById(quizId)
            // Prefer questionItems (DB records with real ids) over legacy questions
            const questions = Array.isArray((quizData as any).questionItems) && (quizData as any).questionItems.length > 0
                ? (quizData as any).questionItems
                : (quizData as any).questions || []

            // Enforce: all questions must have real IDs
            const invalid = (questions || []).filter((q: any) => (q?.id ?? q?.questionId) === undefined || (q?.id ?? q?.questionId) === null)
            if (invalid.length > 0) {
                const msg = `Quiz không hợp lệ: ${invalid.length} câu hỏi thiếu ID thực. Vui lòng liên hệ quản trị viên.`
                setError(msg)
                toast.error(msg)
                // Still set quiz for visibility, but do not initialize answers
                setQuiz({ ...quizData, questions } as any)
                return
            }

            const processedQuiz = { ...quizData, questions }
            setQuiz(processedQuiz as any)

            // Initialize answers array with consistent ID handling
            if (questions && Array.isArray(questions)) {
                const initialAnswers = questions.map((q: any) => {
                    const qId = q?.id ?? q?.questionId
                    const normalizedId = String(qId)
                    return { questionId: normalizedId, answer: '' }
                })
                setAnswers(initialAnswers)
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Không thể tải quiz'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [])
    
    // Fetch attempts
    const fetchAttempts = useCallback(async (quizId: string) => {
        try {
            const attemptData = await quizzesApi.getQuizAttempts(quizId)
            setAttempt(attemptData)
        } catch (err: any) {
            console.error('Error fetching attempts:', err)
        }
    }, [])
    
    // Fetch latest result
    const fetchLatestResult = useCallback(async (quizId: string) => {
        try {
            const latestResult = await quizzesApi.getLatestQuizResult(quizId)
            setResult(latestResult)
        } catch (err: any) {
            console.error('Error fetching latest result:', err)
        }
    }, [])
    
    // Start quiz
    const [startedAt, setStartedAt] = useState<Date | null>(null)

    const startQuiz = useCallback(() => {
        if (!quiz) return
        
        setCurrentQuestionIndex(0)
        setIsTimeUp(false)
        setResult(null)
        setStartedAt(new Date())
        
        // Initialize timer if quiz has time limit
        if (quiz.timeLimit) {
            setTimeRemaining(quiz.timeLimit * 60) // Convert minutes to seconds
        }
    }, [quiz])
    
    // Timer effect
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || result !== null) {
            return
        }
        
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 1) {
                    setIsTimeUp(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        
        return () => clearInterval(timer)
    }, [timeRemaining, result])
    
    // Auto-submit when time is up
    useEffect(() => {
        if (isTimeUp && !result && quiz) {
            toast.warning('Hết giờ! Quiz sẽ được nộp tự động.')
            submitQuizHandler()
        }
    }, [isTimeUp])
    
    // Answer question
    const answerQuestion = useCallback((questionId: string, answer: string) => {
        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === questionId)
            if (existingIndex >= 0) {
                const newAnswers = [...prev]
                newAnswers[existingIndex] = { questionId, answer }
                return newAnswers
            }
            return [...prev, { questionId, answer }]
        })
    }, [])
    
    // Navigation
    const goToQuestion = useCallback((index: number) => {
        if (quiz && index >= 0 && index < (quiz.questions?.length || 0)) {
            setCurrentQuestionIndex(index)
        }
    }, [quiz])
    
    const nextQuestion = useCallback(() => {
        setCurrentQuestionIndex(prev => 
            Math.min(prev + 1, (quiz?.questions?.length || 1) - 1)
        )
    }, [quiz])
    
    const previousQuestion = useCallback(() => {
        setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))
    }, [])
    
    // Submit quiz
    const submitQuizHandler = useCallback(async () => {
        if (!quiz || submitting) return
        
        // Check if all questions are answered
        const unansweredCount = answers.filter(a => !a.answer || a.answer.trim() === '').length
        if (unansweredCount > 0 && !isTimeUp) {
            toast.error(`Còn ${unansweredCount} câu hỏi chưa trả lời`)
            return
        }
        
        setSubmitting(true)
        try {
            // Build payload compatible with backend validator (answers as array of { questionId: number, answer: value })
            const questions = quiz.questions || []
            const answersArray: Array<{ questionId: number, answer: number | string }> = []

            // Validate IDs before building payload
            const missingIds = (questions || []).filter((q: any) => (q as any).id === undefined && (q as any).questionId === undefined)
            if (missingIds.length > 0) {
                toast.error('Quiz không hợp lệ: thiếu ID câu hỏi, không thể nộp bài.')
                setSubmitting(false)
                return
            }

            questions.forEach((q) => {
                const qType = (q as any).questionType ?? (q as any).type
                const qOptions: string[] | undefined = (q as any).options
                const qIdRaw = (q as any).id ?? (q as any).questionId
                const qIdNum = Number(qIdRaw)
                const lookupKey = String(qIdNum)
                const userAnswer = answers.find(a => a.questionId === lookupKey)?.answer
                
                // Check if answer is empty (handle both string and non-string values)
                const answerStr = String(userAnswer ?? '').trim()
                if (!answerStr) return

                if (qType === 'true_false') {
                    // Send numeric 1 (Đúng) or 0 (Sai); accept legacy 'true'/'false'
                    const ua = answerStr.toLowerCase()
                    const numVal = ua === '1' || ua === 'true' ? 1 : 0
                    answersArray.push({ questionId: qIdNum, answer: numVal })
                } else if (qType === 'short_answer') {
                    answersArray.push({ questionId: qIdNum, answer: userAnswer })
                } else {
                    // Multiple choice: radio value is string index -> convert to number
                    const idx = parseInt(answerStr, 10)
                    if (!Number.isNaN(idx)) {
                        answersArray.push({ questionId: qIdNum, answer: idx })
                    }
                }
            })

            const submission = {
                quizId: quiz.id,
                answers: answersArray,
                startedAt: startedAt ? startedAt.toISOString() : undefined,
            }

            const resultData = await quizzesApi.submitQuiz(String(quiz.id), submission as any)
            setResult(resultData)
            
        } catch (err: any) {
            console.error('Submit quiz error:', err?.response?.data || err)
            const errorMessage = err.response?.data?.message || 'Không thể nộp bài'
            toast.error(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }, [quiz, answers, submitting, isTimeUp, startedAt])
    
    // Reset quiz for retry
    const resetQuiz = useCallback(() => {
        if (!quiz) return
        
        setCurrentQuestionIndex(0)
        setResult(null)
        setIsTimeUp(false)
        
        // Reset answers
        if (quiz.questions) {
            const initialAnswers = quiz.questions.map((q, index) => {
                const qId = (q as any).id
                const fallbackIndex = index + 1
                const normalizedId = qId !== undefined && qId !== null
                    ? String(qId)
                    : String(fallbackIndex)
                return {
                    questionId: normalizedId,
                    answer: ''
                }
            })
            setAnswers(initialAnswers)
        }
        
        // Reset timer
        if (quiz.timeLimit) {
            setTimeRemaining(quiz.timeLimit * 60)
        }
    }, [quiz])
    
    return {
        // State
        quiz,
        loading,
        submitting,
        error,
        
        // Quiz taking state
        currentQuestionIndex,
        answers,
        timeRemaining,
        isTimeUp,
        
        // Quiz results
        result,
        attempt,
        
        // Actions
        fetchQuiz,
        fetchAttempts,
        fetchLatestResult,
        startQuiz,
        answerQuestion,
        goToQuestion,
        nextQuestion,
        previousQuestion,
        submitQuiz: submitQuizHandler,
        resetQuiz
    }
}

