// src/controllers/lesson-notes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js'
import ApiResponse from '../utils/response.util.js'
import lessonNotesService from '../services/lesson-notes.service.js'

class LessonNotesController {
    /**
     * Get note for a lesson
     * GET /api/v1/notes/lessons/:lessonId
     */
    getLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id
        const userRole = req.user.role // Added role

        const result = await lessonNotesService.getLessonNote(
            userId,
            parseInt(lessonId),
            userRole, // Pass role
        )

        return ApiResponse.success(
            res,
            result,
            'Truy xuất ghi chú bài học thành công',
        )
    })

    /**
     * Create or update note for a lesson
     * PUT /api/v1/notes/lessons/:lessonId
     */
    upsertLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id
        const { content } = req.body
        const userRole = req.user.role // Added role

        const result = await lessonNotesService.upsertLessonNote(
            userId,
            parseInt(lessonId),
            content,
            userRole, // Pass role
        )

        return ApiResponse.success(
            res,
            result,
            'Lưu ghi chú bài học thành công',
        )
    })

    /**
     * Delete note for a lesson
     * DELETE /api/v1/notes/lessons/:lessonId
     */
    deleteLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params
        const userId = req.user.id
        const userRole = req.user.role // Added role

        const result = await lessonNotesService.deleteLessonNote(
            userId,
            parseInt(lessonId),
            userRole, // Pass role
        )

        return ApiResponse.success(
            res,
            result,
            'Xoá ghi chú bài học thành công',
        )
    })

    /**
     * Get all notes for a course
     * GET /api/v1/notes/courses/:courseId
     */
    getCourseNotes = asyncHandler(async (req, res) => {
        const { courseId } = req.params
        const userId = req.user.id
        const userRole = req.user.role

        const result = await lessonNotesService.getCourseNotes(
            userId,
            parseInt(courseId),
            userRole,
        )

        return ApiResponse.success(
            res,
            result,
            'Truy xuất ghi chú bài học thành công',
        )
    })
}

export default new LessonNotesController()
