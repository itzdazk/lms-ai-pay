// src/controllers/lesson-notes.controller.js
import { asyncHandler } from '../middlewares/error.middleware.js';
import ApiResponse from '../utils/response.util.js';
import lessonNotesService from '../services/lesson-notes.service.js';

class LessonNotesController {
    /**
     * Get note for a lesson
     * GET /api/v1/notes/lessons/:lessonId
     */
    getLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const result = await lessonNotesService.getLessonNote(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            result,
            'Lesson note retrieved successfully'
        );
    });

    /**
     * Create or update note for a lesson
     * PUT /api/v1/notes/lessons/:lessonId
     */
    upsertLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;

        const result = await lessonNotesService.upsertLessonNote(
            userId,
            parseInt(lessonId),
            content
        );

        return ApiResponse.success(
            res,
            result,
            'Lesson note saved successfully'
        );
    });

    /**
     * Delete note for a lesson
     * DELETE /api/v1/notes/lessons/:lessonId
     */
    deleteLessonNote = asyncHandler(async (req, res) => {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const result = await lessonNotesService.deleteLessonNote(
            userId,
            parseInt(lessonId)
        );

        return ApiResponse.success(
            res,
            result,
            'Lesson note deleted successfully'
        );
    });

    /**
     * Get all notes for a course
     * GET /api/v1/notes/courses/:courseId
     */
    getCourseNotes = asyncHandler(async (req, res) => {
        const { courseId } = req.params;
        const userId = req.user.id;

        const result = await lessonNotesService.getCourseNotes(
            userId,
            parseInt(courseId)
        );

        return ApiResponse.success(
            res,
            result,
            'Course notes retrieved successfully'
        );
    });
}

export default new LessonNotesController();


