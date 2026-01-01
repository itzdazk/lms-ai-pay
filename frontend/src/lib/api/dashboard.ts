import apiClient from './client'
import type {
    ApiResponse,
    DashboardStats,
    LearningProgress,
    Course,
    Order,
    Enrollment,
    PaginatedApiResponse,
} from './types'
import type { Activity } from '../dashboardUtils'

export const dashboardApi = {
    // Get student dashboard overview (all-in-one)
    async getStudentDashboard(): Promise<{
        stats: any
        enrolledCourses: any[]
        continueWatching: any[]
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student'
        )
        return response.data.data
    },

    // Get student dashboard stats
    async getStudentStats(): Promise<{
        totalEnrollments: number
        activeEnrollments: number
        completedEnrollments: number
        coursesInProgress: number
        totalLessonsCompleted: number
        totalStudyTime: number
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/stats'
        )
        return response.data.data
    },

    // Get enrolled courses
    async getStudentEnrolledCourses(limit?: number): Promise<
        Array<{
            id: number
            courseId: number
            enrolledAt: string
            lastAccessedAt: string | null
            completedAt: string | null
            status: string
            progressPercentage: number
            completedLessons: number
            totalLessons: number
            course: Course
        }>
    > {
        const params = limit ? `?limit=${limit}` : ''
        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/student/enrolled-courses${params}`
        )
        return response.data.data
    },

    // Get continue watching
    async getStudentContinueWatching(limit?: number): Promise<
        Array<{
            id: number
            title: string
            slug: string
            videoUrl: string
            videoDuration: number | null
            watchDuration: number
            position: number
            course: {
                id: number
                title: string
                slug: string
                thumbnailUrl: string | null
            }
            lastWatchedAt: string
        }>
    > {
        const params = limit ? `?limit=${limit}` : ''
        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/student/continue-watching${params}`
        )
        return response.data.data
    },

    // Get learning progress
    async getLearningProgress(): Promise<LearningProgress[]> {
        const response = await apiClient.get<ApiResponse<LearningProgress[]>>(
            '/dashboard/progress'
        )
        return response.data.data
    },

    // Get completed courses
    async getCompletedCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/completed'
        )
        return response.data.data
    },

    // Get recommended courses (AI recommendations)
    async getRecommendedCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/recommendations'
        )
        return response.data.data
    },

    // Student Dashboard Phase 1 APIs
    async getRecentActivities(options?: {
        limit?: number
        type?: 'ENROLLMENT' | 'LESSON_COMPLETED' | 'QUIZ_SUBMITTED'
        dateFrom?: string
    }): Promise<{ activities: Activity[]; meta: any }> {
        const params = new URLSearchParams()
        if (options?.limit) params.append('limit', options.limit.toString())
        if (options?.type) params.append('type', options.type)
        if (options?.dateFrom) params.append('dateFrom', options.dateFrom)

        const response = await apiClient.get<ApiResponse<Activity[]>>(
            `/dashboard/student/recent-activities?${params.toString()}`
        )
        return {
            activities: response.data.data,
            meta: response.data.meta || {},
        }
    },

    async getQuizPerformance(): Promise<{
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
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/quiz-performance'
        )
        return response.data.data
    },

    async getStudyTimeAnalytics(): Promise<{
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
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/study-time'
        )
        return response.data.data
    },

    async getStudentRecommendations(limit?: number): Promise<Course[]> {
        const params = limit ? `?limit=${limit}` : ''
        const response = await apiClient.get<ApiResponse<Course[]>>(
            `/dashboard/student/recommendations${params}`
        )
        return response.data.data
    },

    // Get instructor dashboard stats
    async getInstructorStats(): Promise<{
        totalCourses: number
        totalStudents: number
        totalRevenue: number
        averageRating: number
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/instructor/stats'
        )
        return response.data.data
    },

    // Get instructor courses
    async getInstructorCourses(): Promise<Course[]> {
        const response = await apiClient.get<ApiResponse<Course[]>>(
            '/dashboard/instructor/courses'
        )
        return response.data.data
    },

    // Admin Dashboard APIs
    async getAdminDashboard(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin'
        )
        return response.data.data
    },

    async getAdminStats(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/user-stats'
        )
        return response.data.data
    },

    async getAdminUsersAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/users-analytics'
        )
        return response.data.data
    },

    async getAdminCoursesAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/courses-analytics'
        )
        return response.data.data
    },

    async getAdminRevenueAnalytics(): Promise<any> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/admin/revenue'
        )
        return response.data.data
    },

    async getAdminRecentActivities(limit?: number): Promise<any> {
        const params = limit ? `?limit=${limit}` : ''
        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/admin/activities${params}`
        )
        return response.data.data
    },

    // Instructor Orders APIs
    async getInstructorOrders(filters?: {
        page?: number
        limit?: number
        search?: string
        paymentStatus?: string
        paymentGateway?: string
        courseId?: number
        startDate?: string
        endDate?: string
        sort?: string
    }): Promise<{
        orders: Order[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search) params.append('search', filters.search)
        if (filters?.paymentStatus)
            params.append('paymentStatus', filters.paymentStatus)
        if (filters?.paymentGateway)
            params.append('paymentGateway', filters.paymentGateway)
        if (filters?.courseId)
            params.append('courseId', filters.courseId.toString())
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Order>>(
            `/dashboard/instructor/orders?${params.toString()}`
        )
        return {
            orders: response.data.data,
            pagination: response.data.pagination,
        }
    },

    // Instructor Enrollments APIs
    async getInstructorEnrollments(filters?: {
        page?: number
        limit?: number
        search?: string
        courseId?: number
        status?: string
        startDate?: string
        endDate?: string
        sort?: string
    }): Promise<{
        enrollments: Enrollment[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search) params.append('search', filters.search)
        if (filters?.courseId)
            params.append('courseId', filters.courseId.toString())
        if (filters?.status) params.append('status', filters.status)
        if (filters?.startDate) params.append('startDate', filters.startDate)
        if (filters?.endDate) params.append('endDate', filters.endDate)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Enrollment>>(
            `/dashboard/instructor/enrollments?${params.toString()}`
        )
        return {
            enrollments: response.data.data,
            pagination: response.data.pagination,
        }
    },

    // Phase 2: Student Dashboard Advanced Features
    async getLearningStreak(): Promise<{
        currentStreak: number
        longestStreak: number
        lastLearningDate: string | null
        streakMaintained: boolean
        daysUntilStreakBreak: number
        weeklyPattern: {
            monday: boolean
            tuesday: boolean
            wednesday: boolean
            thursday: boolean
            friday: boolean
            saturday: boolean
            sunday: boolean
        }
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/learning-streak'
        )
        return response.data.data
    },

    async getCalendarHeatmap(
        year?: number,
        month?: number
    ): Promise<{
        year: number
        month: number
        days: Array<{
            date: string
            lessonCount: number
            studyMinutes: number
            level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
        }>
        summary: {
            totalDays: number
            activeDays: number
            totalLessons: number
            totalStudyMinutes: number
        }
    }> {
        const params = new URLSearchParams()
        if (year) params.append('year', year.toString())
        if (month) params.append('month', month.toString())

        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/student/calendar-heatmap?${params.toString()}`
        )
        return response.data.data
    },

    async getCertificates(): Promise<
        Array<{
            id: number
            courseId: number
            courseTitle: string
            courseSlug: string
            instructorName: string
            completedAt: string
            certificateUrl: string
            certificateCode: string
            thumbnailUrl: string | null
        }>
    > {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/certificates'
        )
        return response.data.data
    },

    async getLearningGoals(): Promise<
        Array<{
            id: number
            type: string
            targetValue: number
            currentValue: number
            percentage: number
            status: string
            deadline: string | null
            course: {
                id: number
                title: string
                slug: string
            } | null
            createdAt: string
        }>
    > {
        const response = await apiClient.get<ApiResponse<any>>(
            '/dashboard/student/goals'
        )
        return response.data.data
    },

    async createLearningGoal(data: {
        type: string
        targetValue: number
        courseId?: number
        deadline?: string
    }): Promise<any> {
        const response = await apiClient.post<ApiResponse<any>>(
            '/dashboard/student/goals',
            data
        )
        return response.data.data
    },

    async updateLearningGoal(
        id: number,
        data: {
            type?: string
            targetValue?: number
            courseId?: number
            deadline?: string
            status?: string
        }
    ): Promise<any> {
        const response = await apiClient.put<ApiResponse<any>>(
            `/dashboard/student/goals/${id}`,
            data
        )
        return response.data.data
    },

    async deleteLearningGoal(id: number): Promise<void> {
        await apiClient.delete(`/dashboard/student/goals/${id}`)
    },

    async getCourseProgressDetail(courseId: number): Promise<{
        course: {
            id: number
            title: string
            slug: string
            thumbnailUrl: string | null
            totalLessons: number
            completedLessons: number
            progressPercentage: number
        }
        enrollment: {
            enrolledAt: string
            lastAccessedAt: string | null
            status: string
        }
        chapters: Array<{
            id: number
            title: string
            chapterOrder: number
            lessons: Array<{
                id: number
                title: string
                slug: string
                lessonOrder: number
                isCompleted: boolean
                completedAt: string | null
                watchDuration: number
                videoDuration: number | null
                progressPercentage: number
                quizScore: number | null
            }>
            completedLessons: number
            totalLessons: number
            progressPercentage: number
        }>
        orphanLessons?: Array<{
            id: number
            title: string
            slug: string
            lessonOrder: number
            isCompleted: boolean
            completedAt: string | null
            watchDuration: number
            videoDuration: number | null
            progressPercentage: number
            quizScore: number | null
        }>
        statistics: {
            totalStudyTime: number
            averageQuizScore: number | null
            estimatedTimeRemaining: number
        }
    }> {
        const response = await apiClient.get<ApiResponse<any>>(
            `/dashboard/student/courses/${courseId}/progress-detail`
        )
        return response.data.data
    },

    // Study Schedule APIs
    async getStudySchedules(params?: {
        dateFrom?: string
        dateTo?: string
        courseId?: number
        status?: string
        limit?: number
        offset?: number
    }): Promise<Array<StudySchedule>> {
        const queryParams = new URLSearchParams()
        if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
        if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
        if (params?.courseId)
            queryParams.append('courseId', params.courseId.toString())
        if (params?.status) queryParams.append('status', params.status)
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.offset)
            queryParams.append('offset', params.offset.toString())

        const queryString = queryParams.toString()
        const url = `/dashboard/student/study-schedules${
            queryString ? `?${queryString}` : ''
        }`
        const response = await apiClient.get<ApiResponse<StudySchedule[]>>(url)
        return response.data.data
    },

    async getStudyScheduleById(id: number): Promise<StudySchedule> {
        const response = await apiClient.get<ApiResponse<StudySchedule>>(
            `/dashboard/student/study-schedules/${id}`
        )
        return response.data.data
    },

    async getTodaySchedules(): Promise<StudySchedule[]> {
        const response = await apiClient.get<ApiResponse<StudySchedule[]>>(
            '/dashboard/student/study-schedules/today'
        )
        return response.data.data
    },

    async getUpcomingSchedules(): Promise<StudySchedule[]> {
        const response = await apiClient.get<ApiResponse<StudySchedule[]>>(
            '/dashboard/student/study-schedules/upcoming'
        )
        return response.data.data
    },

    async createStudySchedule(
        data: CreateStudyScheduleData
    ): Promise<StudySchedule> {
        const response = await apiClient.post<ApiResponse<StudySchedule>>(
            '/dashboard/student/study-schedules',
            data
        )
        return response.data.data
    },

    async updateStudySchedule(
        id: number,
        data: UpdateStudyScheduleData
    ): Promise<StudySchedule> {
        const response = await apiClient.put<ApiResponse<StudySchedule>>(
            `/dashboard/student/study-schedules/${id}`,
            data
        )
        return response.data.data
    },

    async deleteStudySchedule(id: number): Promise<void> {
        await apiClient.delete(`/dashboard/student/study-schedules/${id}`)
    },

    async completeSchedule(id: number): Promise<StudySchedule> {
        const response = await apiClient.post<ApiResponse<StudySchedule>>(
            `/dashboard/student/study-schedules/${id}/complete`
        )
        return response.data.data
    },

    async skipSchedule(id: number): Promise<StudySchedule> {
        const response = await apiClient.post<ApiResponse<StudySchedule>>(
            `/dashboard/student/study-schedules/${id}/skip`
        )
        return response.data.data
    },

    async getScheduleSuggestions(): Promise<ScheduleSuggestion[]> {
        const response = await apiClient.get<ApiResponse<ScheduleSuggestion[]>>(
            '/dashboard/student/study-schedules/suggestions'
        )
        return response.data.data
    },
}

// Study Schedule Types
export interface StudySchedule {
    id: number
    userId: number
    courseId: number
    lessonId: number | null
    title: string | null
    scheduledDate: string
    duration: number
    reminderMinutes: number
    isReminderSent: boolean
    reminderSentAt: string | null
    repeatType: 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM' | null
    repeatDays: number[] | null
    repeatUntil: string | null
    notes: string | null
    status: 'scheduled' | 'completed' | 'skipped' | 'cancelled'
    completedAt: string | null
    createdAt: string
    updatedAt: string
    course: {
        id: number
        title: string
        slug: string
        thumbnailUrl: string | null
    }
    lesson: {
        id: number
        title: string
        slug: string
        videoDuration: number | null
    } | null
}

export interface CreateStudyScheduleData {
    courseId: number
    lessonId?: number | null
    title?: string | null
    scheduledDate: string
    duration?: number
    reminderMinutes?: number
    repeatType?: 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM' | null
    repeatDays?: number[] | null
    repeatUntil?: string | null
    notes?: string | null
}

export interface UpdateStudyScheduleData {
    courseId?: number
    lessonId?: number | null
    title?: string | null
    scheduledDate?: string
    duration?: number
    reminderMinutes?: number
    repeatType?: 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM' | null
    repeatDays?: number[] | null
    repeatUntil?: string | null
    notes?: string | null
    status?: 'scheduled' | 'completed' | 'skipped' | 'cancelled'
}

export interface ScheduleSuggestion {
    courseId: number
    courseTitle: string
    courseSlug: string
    lessonId: number
    lessonTitle: string
    lessonSlug: string
    suggestedDuration: number
}
