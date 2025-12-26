// src/routes/instructor-quizzes.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import instructorQuizzesController from '../controllers/instructor-quizzes.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { isInstructor } from '../middlewares/role.middleware.js';
import {
    createLessonQuizValidator,
    deleteQuizValidator,
    getInstructorQuizSubmissionsValidator,
    getQuizAnalyticsValidator,
    publishQuizValidator,
    updateQuizValidator,
    generateQuizFromLessonValidator,
    generateQuizFromCourseValidator,
} from '../validators/quizzes.validator.js';

// Rate limiting cho AI generation (10 requests per 15 minutes)
const aiGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // 10 requests per window
    message: {
        success: false,
        message: 'Too many AI generation requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

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

/**
 * @route   POST /api/v1/instructor/quizzes/generate-from-lesson
 * @desc    Generate quiz questions from lesson using AI
 * @access  Private (Instructor/Admin)
 * @body    { lessonId, numQuestions?, difficulty?, includeExplanation?, useCache? }
 */
router.post(
    '/quizzes/generate-from-lesson',
    authenticate,
    isInstructor,
    aiGenerationLimiter, // Rate limiting
    generateQuizFromLessonValidator,
    instructorQuizzesController.generateQuizFromLesson
);

/**
 * @route   POST /api/v1/instructor/quizzes/generate-from-course
 * @desc    Generate quiz questions from course using AI
 * @access  Private (Instructor/Admin)
 * @body    { courseId, numQuestions?, difficulty?, includeExplanation?, useCache? }
 */
router.post(
    '/quizzes/generate-from-course',
    authenticate,
    isInstructor,
    aiGenerationLimiter, // Rate limiting
    generateQuizFromCourseValidator,
    instructorQuizzesController.generateQuizFromCourse
);

export default router;

