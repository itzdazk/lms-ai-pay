// src/validators/quizzes.validator.js
import { body, param, query } from 'express-validator'
import { validate } from '../middlewares/validate.middleware.js'

const getQuizByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    validate,
]

const getLessonQuizzesValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    validate,
]

const getCourseQuizzesValidator = [
    param('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    validate,
]

const submitQuizValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    body('answers')
        .isArray({ min: 1 })
        .withMessage('Câu trả lời phải là một mảng không rỗng'),
    body('answers.*.questionId')
        .isInt({ min: 1 })
        .withMessage(
            'Mỗi câu trả lời phải bao gồm questionId là số nguyên dương'
        ),
    body('answers.*.answer')
        .not()
        .isEmpty()
        .withMessage('Mỗi câu trả lời phải bao gồm giá trị không rỗng'),
    body('startedAt')
        .optional()
        .isISO8601()
        .withMessage(
            'startedAt phải là chuỗi ngày hợp lệ theo định dạng ISO 8601'
        ),
    validate,
]

const paginationQueryValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1 đến 100'),
]

const getQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    ...paginationQueryValidator,
    validate,
]

const getQuizSubmissionDetailsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    param('submissionId')
        .isInt({ min: 1 })
        .withMessage('ID bài nộp phải là số nguyên dương'),
    validate,
]

const getQuizAttemptsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    validate,
]

const createLessonQuizValidator = [
    param('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    body('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề là bắt buộc'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Mô tả phải là chuỗi ký tự'),
    body('questions')
        .optional()
        .isArray()
        .withMessage('Danh sách câu hỏi phải là một mảng'),
    body('passingScore')
        .isInt({ min: 0, max: 100 })
        .withMessage('Điểm đạt phải từ 0 đến 100'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),
    validate,
]

const updateQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    body('title')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề phải là chuỗi ký tự không rỗng'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Mô tả phải là chuỗi ký tự'),
    body('questions')
        .optional()
        .isArray({ min: 1 })
        .withMessage(
            'Danh sách câu hỏi phải là một mảng có ít nhất một phần tử'
        ),
    body('passingScore')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Điểm đạt phải từ 0 đến 100'),
    validate,
]

const deleteQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    validate,
]

const publishQuizValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    body('isPublished')
        .isBoolean()
        .withMessage(
            'isPublished phải được cung cấp dưới dạng giá trị boolean'
        ),
    validate,
]

const getInstructorQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    ...paginationQueryValidator,
    query('studentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('studentId phải là số nguyên dương'),
    query('isPassed')
        .optional()
        .isBoolean()
        .withMessage('isPassed phải là giá trị boolean'),
    validate,
]

const getQuizAnalyticsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    validate,
]

// Question-level validators
const createQuestionValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    body('question')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Nội dung câu hỏi là bắt buộc'),
    body('type')
        .optional()
        .isIn(['multiple_choice', 'true_false', 'short_answer'])
        .withMessage('Loại câu hỏi không hợp lệ'),
    body('options')
        .optional()
        .custom((value) => Array.isArray(value) || typeof value === 'object')
        .withMessage('Các lựa chọn phải là một mảng hoặc đối tượng'),
    body('correctAnswer')
        .optional({ nullable: true })
        .custom(
            (v) => typeof v === 'string' || typeof v === 'number' || v === null
        )
        .withMessage('Đáp án đúng phải là chuỗi ký tự, số hoặc null'),
    body('explanation')
        .optional({ nullable: true })
        .isString()
        .withMessage('Giải thích phải là chuỗi ký tự'),
    body('questionOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thứ tự câu hỏi phải là số nguyên không âm'),
    validate,
]

const updateQuestionValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    param('questionId')
        .isInt({ min: 1 })
        .withMessage('ID câu hỏi phải là số nguyên dương'),
    body('question')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Câu hỏi phải là chuỗi ký tự không rỗng'),
    body('type')
        .optional()
        .isIn(['multiple_choice', 'true_false', 'short_answer'])
        .withMessage('Loại câu hỏi không hợp lệ'),
    body('options')
        .optional()
        .custom((value) => Array.isArray(value) || typeof value === 'object')
        .withMessage('Các lựa chọn phải là một mảng hoặc đối tượng'),
    body('correctAnswer')
        .optional({ nullable: true })
        .custom(
            (v) => typeof v === 'string' || typeof v === 'number' || v === null
        )
        .withMessage('Đáp án đúng phải là chuỗi ký tự, số hoặc null'),
    body('explanation')
        .optional({ nullable: true })
        .isString()
        .withMessage('Giải thích phải là chuỗi ký tự'),
    validate,
]

const deleteQuestionValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    param('questionId')
        .isInt({ min: 1 })
        .withMessage('ID câu hỏi phải là số nguyên dương'),
    validate,
]

const reorderQuestionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    body('orders')
        .isArray({ min: 1 })
        .withMessage('Danh sách thứ tự phải là một mảng không rỗng'),
    body('orders.*.questionId')
        .isInt({ min: 1 })
        .withMessage('Mỗi mục thứ tự phải bao gồm questionId hợp lệ'),
    body('orders.*.order')
        .isInt({ min: 0 })
        .withMessage('Mỗi mục thứ tự phải bao gồm giá trị thứ tự không âm'),
    validate,
]

const getAdminQuizzesValidator = [
    ...paginationQueryValidator,
    query('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('courseId phải là số nguyên dương'),
    query('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('lessonId phải là số nguyên dương'),
    query('instructorId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('instructorId phải là số nguyên dương'),
    query('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished phải là giá trị boolean'),
    validate,
]

const getAdminQuizSubmissionsValidator = [
    param('quizId')
        .isInt({ min: 1 })
        .withMessage('ID bài kiểm tra phải là số nguyên dương'),
    ...paginationQueryValidator,
    query('studentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('studentId phải là số nguyên dương'),
    query('isPassed')
        .optional()
        .isBoolean()
        .withMessage('isPassed phải là giá trị boolean'),
    validate,
]

const generateQuizFromLessonValidator = [
    body('lessonId')
        .isInt({ min: 1 })
        .withMessage('ID bài học phải là số nguyên dương'),
    body('numQuestions')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Số lượng câu hỏi phải từ 1 đến 20'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Độ khó phải là một trong: easy, medium, hard'),
    body('includeExplanation')
        .optional()
        .isBoolean()
        .withMessage('includeExplanation phải là giá trị boolean'),
    body('useCache')
        .optional()
        .isBoolean()
        .withMessage('useCache phải là giá trị boolean'),
    validate,
]

const generateQuizFromCourseValidator = [
    body('courseId')
        .isInt({ min: 1 })
        .withMessage('ID khóa học phải là số nguyên dương'),
    body('numQuestions')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Số lượng câu hỏi phải từ 1 đến 30'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Độ khó phải là một trong: easy, medium, hard'),
    body('includeExplanation')
        .optional()
        .isBoolean()
        .withMessage('includeExplanation phải là giá trị boolean'),
    body('useCache')
        .optional()
        .isBoolean()
        .withMessage('useCache phải là giá trị boolean'),
    validate,
]

export {
    getQuizByIdValidator,
    getLessonQuizzesValidator,
    getCourseQuizzesValidator,
    submitQuizValidator,
    getQuizSubmissionsValidator,
    getQuizSubmissionDetailsValidator,
    getQuizAttemptsValidator,
    createLessonQuizValidator,
    updateQuizValidator,
    deleteQuizValidator,
    publishQuizValidator,
    getInstructorQuizSubmissionsValidator,
    getQuizAnalyticsValidator,
    createQuestionValidator,
    updateQuestionValidator,
    deleteQuestionValidator,
    reorderQuestionsValidator,
    getAdminQuizzesValidator,
    getAdminQuizSubmissionsValidator,
    generateQuizFromLessonValidator,
    generateQuizFromCourseValidator,
}
