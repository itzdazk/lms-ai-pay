// Central export for all API modules
export { default as apiClient } from './client'
export * from './types'
export { authApi } from './auth'
export { coursesApi } from './courses'
export { instructorCoursesApi } from './instructor-courses'
export { dashboardApi } from './dashboard'
export { usersApi } from './users'
export { adminCoursesApi } from './admin-courses'
export { lessonsApi } from './lessons'
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
