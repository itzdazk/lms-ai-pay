// src/validators/instructor-course.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'
import { COURSE_STATUS, COURSE_LEVEL } from '../config/constants.js'

/**
 * Validator for getting course enrollments
 */
export const getCourseEnrollmentsValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Từ khóa tìm kiếm phải từ 1 đến 100 ký tự'),
    query('status')
        .optional()
        .isIn(['ACTIVE', 'COMPLETED', 'DROPPED', 'EXPIRED'])
        .withMessage('Trạng thái ghi danh không hợp lệ'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'progress', 'lastAccessed'])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, progress, lastAccessed'
        ),
    validate,
]

/**
 * Validator for getting instructor courses
 */
export const getInstructorCoursesValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Từ khóa tìm kiếm phải từ 1 đến 200 ký tự'),
    query('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Trạng thái phải là một trong: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),
    query('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Trình độ phải là một trong: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    query('sort')
        .optional()
        .isIn([
            'newest',
            'oldest',
            'updated',
            'updated-oldest',
            'popular',
            'rating',
        ])
        .withMessage(
            'Sắp xếp phải là một trong: newest, oldest, updated, updated-oldest, popular, rating'
        ),
    validate,
]

/**
 * Validator for creating a course
 */
export const createCourseValidator = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề không được để trống')
        .isLength({ min: 5, max: 200 })
        .withMessage('Tiêu đề phải từ 5 đến 200 ký tự'),
    body('slug')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Đường dẫn phải từ 5 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn phải là chữ thường và số với dấu gạch ngang (ví dụ: khoa-hoc-cua-toi)'
        ),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Mô tả không được vượt quá 10000 ký tự'),
    body('shortDescription')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả ngắn không được vượt quá 500 ký tự'),
    body('thumbnailUrl')
        .optional()
        .custom((value) => {
            // Allow null, undefined, or empty string to remove thumbnail
            if (value === null || value === undefined || value === '') {
                return true
            }
            // If value is provided, it must be a valid URL
            const trimmedValue = String(value).trim()
            if (trimmedValue === '') {
                return true // Empty string is also allowed (treated as null)
            }
            const urlPattern = /^https?:\/\/.+/i
            if (!urlPattern.test(trimmedValue)) {
                throw new Error('URL ảnh đại diện phải là đường dẫn hợp lệ')
            }
            return true
        }),
    body('videoPreviewUrl')
        .optional()
        .custom((value) => {
            // Allow null, undefined, or empty string to remove video preview
            if (value === null || value === undefined || value === '') {
                return true
            }
            // If value is provided, it must be a valid URL
            const trimmedValue = String(value).trim()
            if (trimmedValue === '') {
                return true // Empty string is also allowed (treated as null)
            }
            const urlPattern = /^https?:\/\/.+/i
            if (!urlPattern.test(trimmedValue)) {
                throw new Error('URL video giới thiệu phải là đường dẫn hợp lệ')
            }
            return true
        }),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng video giới thiệu phải là số nguyên không âm'),
    body('price')
        .notEmpty()
        .withMessage('Giá không được để trống')
        .isFloat({ min: 0 })
        .withMessage('Giá phải là số không âm'),
    body('discountPrice')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value, { req }) => {
            // Allow null to remove discount price
            if (value === null || value === undefined) {
                return true
            }
            // If value is provided, it must be a non-negative number
            const numValue = parseFloat(value)
            if (isNaN(numValue) || numValue < 0) {
                throw new Error('Giá khuyến mãi phải là số không âm')
            }
            // If price exists, discount price must be <= price
            if (req.body.price && numValue > parseFloat(req.body.price)) {
                throw new Error('Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc')
            }
            return true
        }),
    body('categoryId')
        .notEmpty()
        .withMessage('ID danh mục không được để trống')
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),
    body('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Trình độ phải là một trong: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    body('durationHours')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng (giờ) phải là số nguyên không âm'),
    body('language')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Ngôn ngữ phải từ 2 đến 10 ký tự'),
    body('requirements')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Yêu cầu không được vượt quá 5000 ký tự'),
    body('whatYouLearn')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Nội dung học được không được vượt quá 5000 ký tự'),
    body('courseObjectives')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Mục tiêu khóa học không được vượt quá 5000 ký tự'),
    body('targetAudience')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Đối tượng học viên không được vượt quá 5000 ký tự'),
    body('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Trạng thái phải là một trong: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured phải là giá trị boolean'),
    body('tags').optional().isArray().withMessage('Thẻ phải là mảng'),
    body('tags.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Mỗi ID thẻ phải là số nguyên dương'),
    validate,
]

/**
 * Validator for updating a course
 */
export const updateCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Tiêu đề phải từ 5 đến 200 ký tự'),
    body('slug')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Đường dẫn phải từ 5 đến 200 ký tự')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage(
            'Đường dẫn phải là chữ thường và số với dấu gạch ngang (ví dụ: khoa-hoc-cua-toi)'
        ),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('Mô tả không được vượt quá 10000 ký tự'),
    body('shortDescription')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả ngắn không được vượt quá 500 ký tự'),
    body('thumbnailUrl')
        .optional()
        .custom((value) => {
            // Allow null, undefined, or empty string to remove thumbnail
            if (value === null || value === undefined || value === '') {
                return true
            }
            // If value is provided, it must be a valid URL
            const trimmedValue = String(value).trim()
            if (trimmedValue === '') {
                return true // Empty string is also allowed (treated as null)
            }
            const urlPattern = /^https?:\/\/.+/i
            if (!urlPattern.test(trimmedValue)) {
                throw new Error('URL ảnh đại diện phải là đường dẫn hợp lệ')
            }
            return true
        }),
    body('videoPreviewUrl')
        .optional()
        .custom((value) => {
            // Allow null, undefined, or empty string to remove video preview
            if (value === null || value === undefined || value === '') {
                return true
            }
            // If value is provided, it must be a valid URL
            const trimmedValue = String(value).trim()
            if (trimmedValue === '') {
                return true // Empty string is also allowed (treated as null)
            }
            const urlPattern = /^https?:\/\/.+/i
            if (!urlPattern.test(trimmedValue)) {
                throw new Error('URL video giới thiệu phải là đường dẫn hợp lệ')
            }
            return true
        }),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng video giới thiệu phải là số nguyên không âm'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá phải là số không âm'),
    body('discountPrice')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value, { req }) => {
            // Allow null to remove discount price
            if (value === null || value === undefined) {
                return true
            }
            // If value is provided, it must be a non-negative number
            const numValue = parseFloat(value)
            if (isNaN(numValue) || numValue < 0) {
                throw new Error('Giá khuyến mãi phải là số không âm')
            }
            // If price exists, discount price must be <= price
            if (req.body.price && numValue > parseFloat(req.body.price)) {
                throw new Error('Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc')
            }
            return true
        }),
    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục phải là số nguyên dương'),
    body('level')
        .optional()
        .isIn(Object.values(COURSE_LEVEL))
        .withMessage(
            `Trình độ phải là một trong: ${Object.values(COURSE_LEVEL).join(', ')}`
        ),
    body('durationHours')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng (giờ) phải là số nguyên không âm'),
    body('totalLessons')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Tổng số bài học phải là số nguyên không âm'),
    body('language')
        .optional()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Ngôn ngữ phải từ 2 đến 10 ký tự'),
    body('requirements')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Yêu cầu không được vượt quá 5000 ký tự'),
    body('whatYouLearn')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Nội dung học được không được vượt quá 5000 ký tự'),
    body('courseObjectives')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Mục tiêu khóa học không được vượt quá 5000 ký tự'),
    body('targetAudience')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Đối tượng học viên không được vượt quá 5000 ký tự'),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured phải là giá trị boolean'),
    body('tags').optional().isArray().withMessage('Thẻ phải là mảng'),
    body('tags.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Mỗi ID thẻ phải là số nguyên dương'),
    validate,
]

/**
 * Validator for deleting a course
 */
export const deleteCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for changing course status
 */
export const changeCourseStatusValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('status')
        .notEmpty()
        .withMessage('Trạng thái không được để trống')
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(
            `Trạng thái phải là một trong: ${Object.values(COURSE_STATUS).join(', ')}`
        ),
    validate,
]

/**
 * Validator for uploading video preview
 */
export const uploadVideoPreviewValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('videoPreviewUrl')
        .notEmpty()
        .withMessage('URL video giới thiệu không được để trống')
        .trim()
        .isURL()
        .withMessage('URL video giới thiệu phải là đường dẫn hợp lệ'),
    body('videoPreviewDuration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thời lượng video giới thiệu phải là số nguyên không âm'),
    validate,
]

/**
 * Validator for getting a single course by ID
 */
export const getInstructorCourseByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for getting course analytics
 */
export const getCourseAnalyticsValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

/**
 * Validator for adding tags to course
 */
export const addTagsToCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('tagIds')
        .notEmpty()
        .withMessage('ID thẻ không được để trống')
        .isArray({ min: 1 })
        .withMessage('ID thẻ phải là mảng không rỗng'),
    body('tagIds.*')
        .isInt({ min: 1 })
        .withMessage('Mỗi ID thẻ phải là số nguyên dương'),
    validate,
]

/**
 * Validator for removing tag from course
 */
export const removeTagFromCourseValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    param('tagId')
        .isInt({ min: 1 })
        .withMessage('ID thẻ phải là số nguyên dương'),
    validate,
]
