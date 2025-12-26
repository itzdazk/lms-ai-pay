import { apiClient } from './client'
import {
    ApiResponse,
    Quiz,
    QuizSubmission,
    QuizResult,
    QuizAttempt
} from './types'

/**
 * Quiz API
 */

// Get quiz by ID
export const getQuizById = async (quizId: string): Promise<Quiz> => {
    const response = await apiClient.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`)
    return response.data.data
}

// Get quizzes by lesson ID
export const getQuizzesByLesson = async (lessonId: string): Promise<Quiz[]> => {
    const response = await apiClient.get<ApiResponse<Quiz[]>>(`/lessons/${lessonId}/quizzes`)
    return response.data.data
}

// Get quizzes by course ID
export const getQuizzesByCourse = async (courseId: string): Promise<Quiz[]> => {
    const response = await apiClient.get<ApiResponse<Quiz[]>>(`/courses/${courseId}/quizzes`)
    return response.data.data
}

// Submit quiz
export const submitQuiz = async (quizId: string, submission: QuizSubmission): Promise<QuizResult> => {
    const response = await apiClient.post<ApiResponse<QuizResult>>(`/quizzes/${quizId}/submit`, submission)
    return response.data.data
}

// Get quiz submissions (history)
export const getQuizSubmissions = async (quizId: string): Promise<QuizResult[]> => {
    const response = await apiClient.get<ApiResponse<QuizResult[]>>(`/quizzes/${quizId}/submissions`)
    return response.data.data
}

// Get submission by ID
export const getSubmissionById = async (quizId: string, submissionId: string): Promise<QuizResult> => {
    const response = await apiClient.get<ApiResponse<QuizResult>>(`/quizzes/${quizId}/submissions/${submissionId}`)
    return response.data.data
}

// Get attempts count
export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt> => {
    const response = await apiClient.get<ApiResponse<QuizAttempt>>(`/quizzes/${quizId}/attempts`)
    return response.data.data
}

// Get latest result
export const getLatestQuizResult = async (quizId: string): Promise<QuizResult | null> => {
    try {
        const response = await apiClient.get<ApiResponse<QuizResult>>(`/quizzes/${quizId}/result/latest`)
        return response.data.data
    } catch (error) {
        // Return null if no result found
        return null
    }
}

export const quizzesApi = {
    getQuizById,
    getQuizzesByLesson,
    getQuizzesByCourse,
    submitQuiz,
    getQuizSubmissions,
    getSubmissionById,
    getQuizAttempts,
    getLatestQuizResult
}
