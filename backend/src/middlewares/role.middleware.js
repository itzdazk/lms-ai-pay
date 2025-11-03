// src/middlewares/role.middleware.js
const ApiResponse = require('../utils/response.util')
const { USER_ROLES } = require('../config/constants')

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
        const { prisma } = require('../config/database.config')
        const courseId = parseInt(req.params.courseId || req.params.id)

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

module.exports = {
    authorize,
    isAdmin,
    isInstructor,
    isStudent,
    isOwnerOrAdmin,
    isCourseInstructorOrAdmin,
}


