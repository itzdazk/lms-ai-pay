// src/routes/lesson-notes.routes.js
import express from 'express';
import lessonNotesController from '../controllers/lesson-notes.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import {
    getLessonNoteValidator,
    upsertLessonNoteValidator,
    deleteLessonNoteValidator,
    getCourseNotesValidator,
} from '../validators/lesson-notes.validator.js';

const router = express.Router();

/**
 * @route   GET /api/v1/notes/lessons/:lessonId
 * @desc    Get note for a lesson
 * @access  Private
 */
router.get(
    '/lessons/:lessonId',
    authenticate,
    getLessonNoteValidator,
    lessonNotesController.getLessonNote
);

/**
 * @route   PUT /api/v1/notes/lessons/:lessonId
 * @desc    Create or update note for a lesson
 * @access  Private
 */
router.put(
    '/lessons/:lessonId',
    authenticate,
    upsertLessonNoteValidator,
    lessonNotesController.upsertLessonNote
);

/**
 * @route   DELETE /api/v1/notes/lessons/:lessonId
 * @desc    Delete note for a lesson
 * @access  Private
 */
router.delete(
    '/lessons/:lessonId',
    authenticate,
    deleteLessonNoteValidator,
    lessonNotesController.deleteLessonNote
);

/**
 * @route   GET /api/v1/notes/courses/:courseId
 * @desc    Get all notes for a course
 * @access  Private
 */
router.get(
    '/courses/:courseId',
    authenticate,
    getCourseNotesValidator,
    lessonNotesController.getCourseNotes
);

export default router;

