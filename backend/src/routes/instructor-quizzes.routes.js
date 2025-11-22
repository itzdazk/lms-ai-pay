// src/routes/instructor-quizzes.routes.js
import express from 'express';
import instructorQuizzesController from '../controllers/instructor-quizzes.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isInstructor } from '../middlewares/role.middleware.js';
import { isCourseInstructorOrAdmin } from '../middlewares/role.middleware.js';
import {
    createCourseQuizValidator,
    createLessonQuizValidator,
    deleteQuizValidator,
    getInstructorQuizSubmissionsValidator,
    getQuizAnalyticsValidator,
    publishQuizValidator,
    updateQuizValidator,
} from '../validators/quizzes.validator.js';

const router = express.Router();

/**
 * @route   POST /api/v1/instructor/lessons/:lessonId/quizzes
 * @desc    Create quiz for lesson
 * @access  Private (Instructor/Admin)
 */
router.post(
    '/lessons/:lessonId/quizzes',
    authenticate,
    isInstructor,
    createLessonQuizValidator,
    instructorQuizzesController.createLessonQuiz
);

/**
 * @route   POST /api/v1/instructor/courses/:courseId/quizzes
 * @desc    Create quiz for course
 * @access  Private (Instructor/Admin)
 */
router.post(
    '/courses/:courseId/quizzes',
    authenticate,
    isInstructor,
    isCourseInstructorOrAdmin,
    createCourseQuizValidator,
    instructorQuizzesController.createCourseQuiz
);

/**
 * @route   PUT /api/v1/instructor/quizzes/:id
 * @desc    Update quiz
 * @access  Private (Instructor/Admin)
 */
router.put(
    '/quizzes/:id',
    authenticate,
    isInstructor,
    updateQuizValidator,
    instructorQuizzesController.updateQuiz
);

/**
 * @route   DELETE /api/v1/instructor/quizzes/:id
 * @desc    Delete quiz
 * @access  Private (Instructor/Admin)
 */
router.delete(
    '/quizzes/:id',
    authenticate,
    isInstructor,
    deleteQuizValidator,
    instructorQuizzesController.deleteQuiz
);

/**
 * @route   PATCH /api/v1/instructor/quizzes/:id/publish
 * @desc    Publish or unpublish quiz
 * @access  Private (Instructor/Admin)
 */
router.patch(
    '/quizzes/:id/publish',
    authenticate,
    isInstructor,
    publishQuizValidator,
    instructorQuizzesController.publishQuiz
);

/**
 * @route   GET /api/v1/instructor/quizzes/:quizId/submissions
 * @desc    List quiz submissions (all students)
 * @access  Private (Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/submissions',
    authenticate,
    isInstructor,
    getInstructorQuizSubmissionsValidator,
    instructorQuizzesController.getInstructorQuizSubmissions
);

/**
 * @route   GET /api/v1/instructor/quizzes/:quizId/analytics
 * @desc    Quiz analytics summary
 * @access  Private (Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/analytics',
    authenticate,
    isInstructor,
    getQuizAnalyticsValidator,
    instructorQuizzesController.getQuizAnalytics
);

export default router;

