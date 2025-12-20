// src/middlewares/role.middleware.js
import ApiResponse from '../utils/response.util.js';
import { USER_ROLES, ENROLLMENT_STATUS, COURSE_STATUS } from '../config/constants.js';
import { prisma } from '../config/database.config.js';

/**
 * Check if user has required role(s)
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Authentication required')
        }

        if (!allowedRoles.includes(req.user.role)) {
            return ApiResponse.forbidden(
                res,
                'You do not have permission to access this resource'
            )
        }

        next()
    }
}

/**
 * Check if user is admin
 */
const isAdmin = authorize(USER_ROLES.ADMIN)

/**
 * Check if user is instructor or admin
 */
const isInstructor = authorize(USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN)

/**
 * Check if user is student (any authenticated user)
 */
const isStudent = authorize(
    USER_ROLES.STUDENT,
    USER_ROLES.INSTRUCTOR,
    USER_ROLES.ADMIN
)

/**
 * Check if user owns the resource or is admin
 */
const isOwnerOrAdmin = (getUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'Authentication required')
        }

        const resourceUserId =
            typeof getUserId === 'function'
                ? getUserId(req)
                : parseInt(req.params[getUserId] || req.params.userId)

        if (
            req.user.role === USER_ROLES.ADMIN ||
            req.user.id === resourceUserId
        ) {
            return next()
        }

        return ApiResponse.forbidden(
            res,
            'You do not have permission to access this resource'
        )
    }
}

/**
 * Check if user is the course instructor or admin
 */
const isCourseInstructorOrAdmin = async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.courseId || req.params.id);

        if (!courseId) {
            return ApiResponse.badRequest(res, 'Course ID is required')
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true },
        })

        if (!course) {
            return ApiResponse.notFound(res, 'Course not found')
        }

        if (
            req.user.role === USER_ROLES.ADMIN ||
            req.user.id === course.instructorId
        ) {
            return next()
        }

        return ApiResponse.forbidden(
            res,
            'You do not have permission to manage this course'
        )
    } catch (error) {
        return ApiResponse.error(res, 'Error checking course permissions')
    }
}

/**
 * Check if user has access to lesson (enrolled, instructor, or admin)
 * Also checks if lesson and course are published (unless user is instructor/admin)
 * @param {string} lessonIdParam - Parameter name for lesson ID (default: 'id')
 * @param {string} courseSlugParam - Optional parameter name for course slug
 * @param {string} lessonSlugParam - Optional parameter name for lesson slug
 */
const isEnrolledOrInstructorOrAdmin = (lessonIdParam = 'id', courseSlugParam = null, lessonSlugParam = null) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return ApiResponse.unauthorized(res, 'Authentication required')
            }

            let lesson = null

            // If slug params are provided, use slug lookup
            if (courseSlugParam && lessonSlugParam) {
                const courseSlug = req.params[courseSlugParam]
                const lessonSlug = req.params[lessonSlugParam]

                if (!courseSlug || !lessonSlug) {
                    return ApiResponse.badRequest(res, 'Course slug and lesson slug are required')
                }

                // Find course by slug
                const course = await prisma.course.findUnique({
                    where: { slug: courseSlug },
                    select: { id: true },
                })

                if (!course) {
                    return ApiResponse.notFound(res, 'Course not found')
                }

                // Find lesson by slug within course
                lesson = await prisma.lesson.findUnique({
                    where: {
                        courseId_slug: {
                            courseId: course.id,
                            slug: lessonSlug,
                        },
                    },
                    include: {
                        course: {
                            select: {
                                id: true,
                                status: true,
                                instructorId: true,
                            },
                        },
                    },
                })
            } else if (lessonIdParam) {
                // Use ID lookup (original behavior)
                const lessonId = parseInt(req.params[lessonIdParam])

                if (!lessonId || isNaN(lessonId)) {
                    return ApiResponse.badRequest(res, 'Lesson ID is required')
                }

                lesson = await prisma.lesson.findUnique({
                    where: { id: lessonId },
                    include: {
                        course: {
                            select: {
                                id: true,
                                status: true,
                                instructorId: true,
                            },
                        },
                    },
                })
            } else {
                return ApiResponse.badRequest(res, 'Either lesson ID or course slug and lesson slug are required')
            }

            if (!lesson) {
                return ApiResponse.notFound(res, 'Lesson not found')
            }

            const isAdmin = req.user.role === USER_ROLES.ADMIN
            const isCourseInstructor = req.user.id === lesson.course.instructorId

            // Admin and course instructor have full access
            if (isAdmin || isCourseInstructor) {
                return next()
            }

            // Check enrollment for regular users
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: req.user.id,
                    courseId: lesson.course.id,
                    status: {
                        in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.COMPLETED],
                    },
                },
            })

            if (!enrollment) {
                return ApiResponse.forbidden(
                    res,
                    'You do not have access to this lesson'
                )
            }

            // Check if lesson is published
            if (!lesson.isPublished) {
                return ApiResponse.forbidden(
                    res,
                    'This lesson is not available'
                )
            }

            // Check if course is published
            if (lesson.course.status !== COURSE_STATUS.PUBLISHED) {
                return ApiResponse.forbidden(
                    res,
                    'This lesson is not available'
                )
            }

            next()
        } catch (error) {
            return ApiResponse.error(res, 'Error checking lesson access')
        }
    }
}

export {
    authorize,
    isAdmin,
    isInstructor,
    isStudent,
    isOwnerOrAdmin,
    isCourseInstructorOrAdmin,
    isEnrolledOrInstructorOrAdmin,
};

