// src/routes/student-quizzes.routes.js
import express from 'express';
import studentQuizzesController from '../controllers/student-quizzes.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isStudent } from '../middlewares/role.middleware.js';
import {
    submitQuizValidator,
    getQuizSubmissionsValidator,
    getQuizSubmissionDetailsValidator,
    getQuizAttemptsValidator,
} from '../validators/quizzes.validator.js';

const router = express.Router();

/**
 * @route   POST /api/v1/quizzes/:quizId/submit
 * @desc    Submit quiz answers
 * @access  Private (Student/Instructor/Admin)
 */
router.post(
    '/quizzes/:quizId/submit',
    authenticate,
    isStudent,
    submitQuizValidator,
    studentQuizzesController.submitQuiz
);

/**
 * @route   GET /api/v1/quizzes/:quizId/submissions
 * @desc    Get quiz submissions for current user
 * @access  Private (Student/Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/submissions',
    authenticate,
    isStudent,
    getQuizSubmissionsValidator,
    studentQuizzesController.getQuizSubmissions
);

/**
 * @route   GET /api/v1/quizzes/:quizId/submissions/:submissionId
 * @desc    Get quiz submission detail by ID
 * @access  Private (Student/Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/submissions/:submissionId',
    authenticate,
    isStudent,
    getQuizSubmissionDetailsValidator,
    studentQuizzesController.getQuizSubmissionById
);

/**
 * @route   GET /api/v1/quizzes/:quizId/attempts
 * @desc    Get quiz attempts summary for current user
 * @access  Private (Student/Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/attempts',
    authenticate,
    isStudent,
    getQuizAttemptsValidator,
    studentQuizzesController.getQuizAttempts
);

/**
 * @route   GET /api/v1/quizzes/:quizId/result/latest
 * @desc    Get latest quiz result for current user
 * @access  Private (Student/Instructor/Admin)
 */
router.get(
    '/quizzes/:quizId/result/latest',
    authenticate,
    isStudent,
    getQuizAttemptsValidator,
    studentQuizzesController.getLatestQuizResult
);

export default router;

