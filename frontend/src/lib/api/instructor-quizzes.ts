import apiClient from './client'
import type {
    ApiResponse,
    Quiz,
    CreateQuizRequest,
    UpdateQuizRequest,
    QuizSubmission,
} from './types'

/**
 * Instructor Quizzes API
 * Handles quiz management for instructors
 */
export const instructorQuizzesApi = {
    /**
     * Get all quizzes for a lesson
     */
    async getQuizzes(lessonId: number): Promise<Quiz[]> {
        const response = await apiClient.get<ApiResponse<Quiz[]>>(
            `/lessons/${lessonId}/quizzes`
        )
        return response.data.data || []
    },

    /**
     * Get single quiz by ID
     */
    async getQuiz(quizId: number): Promise<Quiz> {
        const response = await apiClient.get<ApiResponse<Quiz>>(
            `/quizzes/${quizId}`
        )
        return response.data.data
    },

    /**
     * Create new quiz for a lesson
     */
    async createLessonQuiz(
        lessonId: number,
        data: CreateQuizRequest
    ): Promise<Quiz> {
        const response = await apiClient.post<ApiResponse<Quiz>>(
            `/instructor/lessons/${lessonId}/quizzes`,
            {
                ...data,
                lessonId,
            }
        )
        return response.data.data
    },

    /**
     * Update quiz
     */
    async updateQuiz(quizId: number, data: UpdateQuizRequest): Promise<Quiz> {
        const response = await apiClient.put<ApiResponse<Quiz>>(
            `/instructor/quizzes/${quizId}`,
            data
        )
        return response.data.data
    },

    /**
     * Delete quiz
     */
    async deleteQuiz(quizId: number): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/instructor/quizzes/${quizId}`
        )
    },

    /**
     * Publish or unpublish quiz
     */
    async publishQuiz(
        quizId: number,
        isPublished: boolean
    ): Promise<Quiz> {
        const response = await apiClient.patch<ApiResponse<Quiz>>(
            `/instructor/quizzes/${quizId}/publish`,
            { isPublished }
        )
        return response.data.data
    },

    /**
     * Get quiz submissions from students
     */
    async getSubmissions(quizId: number): Promise<QuizSubmission[]> {
        const response = await apiClient.get<ApiResponse<QuizSubmission[]>>(
            `/instructor/quizzes/${quizId}/submissions`
        )
        return response.data.data || []
    },

    /**
     * Get single submission detail
     */
    async getSubmissionDetail(
        quizId: number,
        submissionId: number
    ): Promise<QuizSubmission> {
        const response = await apiClient.get<ApiResponse<QuizSubmission>>(
            `/quizzes/${quizId}/submissions/${submissionId}`
        )
        return response.data.data
    },

    /**
     * Get quiz analytics
     */
    async getAnalytics(quizId: number): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            `/instructor/quizzes/${quizId}/analytics`
        )
        return response.data.data
    },

    /**
     * Generate quiz questions from lesson using AI
     * Rate limited: 10 requests per 15 minutes
     */
    async generateFromLesson(
        lessonId: number,
        options: {
            numQuestions?: number
            difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
            includeExplanation?: boolean
            useCache?: boolean
        } = {}
    ): Promise<Quiz> {
        const response = await apiClient.post<ApiResponse<Quiz>>(
            `/instructor/quizzes/generate-from-lesson`,
            {
                lessonId,
                ...options,
            }
        )
        return response.data.data
    },

    /**
     * Generate quiz questions from course using AI
     * Rate limited: 10 requests per 15 minutes
     */
    async generateFromCourse(
        courseId: number,
        options: {
            numQuestions?: number
            difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
            includeExplanation?: boolean
            useCache?: boolean
        } = {}
    ): Promise<Quiz> {
        const response = await apiClient.post<ApiResponse<Quiz>>(
            `/instructor/quizzes/generate-from-course`,
            {
                courseId,
                ...options,
            }
        )
        return response.data.data
    },
}
