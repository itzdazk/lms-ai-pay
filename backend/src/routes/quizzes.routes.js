// src/routes/quizzes.routes.js
import express from 'express';
import quizzesController from '../controllers/quizzes.controller.js';
import { authenticate } from '../middlewares/authenticate.middleware.js';
import {
    getCourseQuizzesValidator,
    getLessonQuizzesValidator,
    getQuizByIdValidator,
} from '../validators/quizzes.validator.js';

const router = express.Router();

// Quiz endpoints - Require authentication
// Chỉ student đã đăng ký, instructor đã tạo course, hoặc admin mới được truy cập
router.get(
    '/quizzes/:id',
    authenticate, // Yêu cầu authentication
    getQuizByIdValidator,
    quizzesController.getQuizById
);

router.get(
    '/lessons/:lessonId/quizzes',
    authenticate, // Yêu cầu authentication
    getLessonQuizzesValidator,
    quizzesController.getLessonQuizzes
);

router.get(
    '/courses/:courseId/quizzes',
    authenticate, // Yêu cầu authentication
    getCourseQuizzesValidator,
    quizzesController.getCourseQuizzes
);

export default router;

