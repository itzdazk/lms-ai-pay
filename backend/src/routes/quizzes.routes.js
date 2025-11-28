// src/routes/quizzes.routes.js
import express from 'express';
import quizzesController from '../controllers/quizzes.controller.js';
import {
    getCourseQuizzesValidator,
    getLessonQuizzesValidator,
    getQuizByIdValidator,
} from '../validators/quizzes.validator.js';

const router = express.Router();

// Public quiz endpoints
router.get(
    '/quizzes/:id',
    getQuizByIdValidator,
    quizzesController.getQuizById
);

router.get(
    '/lessons/:lessonId/quizzes',
    getLessonQuizzesValidator,
    quizzesController.getLessonQuizzes
);

router.get(
    '/courses/:courseId/quizzes',
    getCourseQuizzesValidator,
    quizzesController.getCourseQuizzes
);

export default router;

