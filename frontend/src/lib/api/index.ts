// Central export for all API modules
export { default as apiClient } from './client'
export * from './types'
export { authApi } from './auth'
export { coursesApi } from './courses'
export { chaptersApi } from './chapters'
export { instructorCoursesApi } from './instructor-courses'
export { dashboardApi } from './dashboard'
export { usersApi } from './users'
export { adminCoursesApi } from './admin-courses'
export { enrollmentsApi } from './enrollments'
export { ordersApi } from './orders'
export { paymentsApi } from './payments'
export { transactionsApi } from './transactions'
export type { TransactionFilters } from './transactions'
export type {
    EnrollmentWithCourse,
    EnrollmentCheckResponse,
    CreateEnrollmentRequest,
    CreateEnrollmentResponse,
} from './enrollments'
export { lessonsApi } from './lessons'
export { instructorLessonsApi } from './instructor-lessons'
export { lessonNotesApi } from './lesson-notes'
export { instructorQuizzesApi } from './instructor-quizzes'
export { quizzesApi } from './quizzes'
export { categoriesApi, getCategoryPath } from './categories'
export { notificationsApi } from './notifications'
export type {
    GetNotificationsParams,
    NotificationsResponse,
    MarkAllAsReadResponse,
} from './notifications'
export type {
    LessonNote,
    LessonNoteResponse,
    CourseNotesResponse,
    UpsertLessonNoteRequest,
} from './lesson-notes'
export type {
    UpdateProfileRequest,
    ChangePasswordRequest,
    GetUsersParams,
    UpdateUserRequest,
    ChangeRoleRequest,
    ChangeStatusRequest,
} from './users'
export type {
    AdminCourse,
    AdminCourseFilters,
    PlatformAnalytics,
} from './admin-courses'
export type { CategoryFilters, CategoryCoursesFilters } from './categories'
export { progressApi } from './progress'
export { searchApi } from './search'
export type {
    SearchCoursesFilters,
    SearchInstructorsFilters,
    SearchSuggestions,
    InstructorSearchResult,
    VoiceSearchRequest,
    VoiceSearchResponse,
} from './search'
