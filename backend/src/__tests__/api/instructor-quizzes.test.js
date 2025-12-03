// src/__tests__/api/instructor-quizzes.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    createTestCategory,
    createTestCourse,
    createTestLesson,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import {
    USER_ROLES,
    COURSE_STATUS,
} from '../../config/constants.js';

describe('Instructor Quizzes API', () => {
    let instructor;
    let instructorToken;
    let otherInstructor;
    let otherInstructorToken;
    let student;
    let studentToken;
    let category;
    let course;
    let lesson;
    let quiz;

    beforeEach(async () => {
        // Create instructors
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        otherInstructor = await createTestInstructor();
        otherInstructorToken = generateTestToken(otherInstructor);

        // Create student
        student = await createTestUser({
            role: USER_ROLES.STUDENT,
        });
        studentToken = generateTestToken(student);

        // Create category
        category = await createTestCategory({
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
        });

        // Create course
        course = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
            price: 0,
            discountPrice: 0,
        });

        // Create lesson
        lesson = await createTestLesson(course.id, {
            title: `Test Lesson ${Date.now()}`,
            slug: `test-lesson-${Date.now()}`,
            lessonOrder: 1,
            isPublished: true,
        });

        // Create quiz
        quiz = await prisma.quiz.create({
            data: {
                lessonId: lesson.id,
                courseId: course.id,
                title: `Test Quiz ${Date.now()}`,
                description: 'Test quiz description',
                questions: [
                    {
                        id: '1',
                        question: 'What is 2+2?',
                        type: 'multiple-choice',
                        options: ['3', '4', '5', '6'],
                        correctAnswer: '4',
                    },
                ],
                passingScore: 70,
                attemptsAllowed: 3,
                timeLimitMinutes: 30,
                isPublished: true,
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('POST /api/v1/instructor/lessons/:lessonId/quizzes', () => {
        it('should create quiz for lesson', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/lessons/${lesson.id}/quizzes`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'New Quiz',
                    description: 'New quiz description',
                    questions: [
                        {
                            id: '1',
                            question: 'What is 1+1?',
                            type: 'multiple-choice',
                            options: ['1', '2', '3', '4'],
                            correctAnswer: '2',
                        },
                    ],
                    passingScore: 80,
                    attemptsAllowed: 2,
                    timeLimitMinutes: 20,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe('New Quiz');
            expect(response.body.data.lessonId).toBe(lesson.id);
            expect(response.body.data.questions).toBeDefined();
        });

        it('should return 422 for non-existent lesson (validator)', async () => {
            const response = await request(app)
                .post('/api/v1/instructor/lessons/99999/quizzes')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for other instructor lesson (validator)', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/lessons/${lesson.id}/quizzes`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for student', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/lessons/${lesson.id}/quizzes`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for missing title (validator)', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/lessons/${lesson.id}/quizzes`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for empty questions (validator)', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/lessons/${lesson.id}/quizzes`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [],
                })
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/instructor/courses/:courseId/quizzes', () => {
        it('should create quiz for course', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/courses/${course.id}/quizzes`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Course Quiz',
                    description: 'Course quiz description',
                    questions: [
                        {
                            id: '1',
                            question: 'What is the course about?',
                            type: 'multiple-choice',
                            options: ['Option 1', 'Option 2', 'Option 3'],
                            correctAnswer: 'Option 1',
                        },
                    ],
                    passingScore: 70,
                    attemptsAllowed: 1,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe('Course Quiz');
            expect(response.body.data.courseId).toBe(course.id);
            expect(response.body.data.lessonId).toBeNull();
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/v1/instructor/courses/99999/quizzes')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor course', async () => {
            const response = await request(app)
                .post(`/api/v1/instructor/courses/${course.id}/quizzes`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    title: 'New Quiz',
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/instructor/quizzes/:id', () => {
        it('should update quiz', async () => {
            const response = await request(app)
                .put(`/api/v1/instructor/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Quiz Title',
                    description: 'Updated description',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.title).toBe('Updated Quiz Title');
            expect(response.body.data.description).toBe('Updated description');
        });

        it('should update quiz questions', async () => {
            const newQuestions = [
                {
                    id: '1',
                    question: 'Updated question?',
                    type: 'multiple-choice',
                    options: ['A', 'B', 'C'],
                    correctAnswer: 'B',
                },
            ];

            const response = await request(app)
                .put(`/api/v1/instructor/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    questions: newQuestions,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.questions).toBeDefined();
        });

        it('should return 404 for non-existent quiz', async () => {
            const response = await request(app)
                .put('/api/v1/instructor/quizzes/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    title: 'Updated Title',
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor quiz', async () => {
            const response = await request(app)
                .put(`/api/v1/instructor/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    title: 'Updated Title',
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for empty update', async () => {
            const response = await request(app)
                .put(`/api/v1/instructor/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/instructor/quizzes/:id', () => {
        it('should delete quiz', async () => {
            const quizToDelete = await prisma.quiz.create({
                data: {
                    lessonId: lesson.id,
                    courseId: course.id,
                    title: `Quiz To Delete ${Date.now()}`,
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                    passingScore: 70,
                    attemptsAllowed: 1,
                    isPublished: true,
                },
            });

            const response = await request(app)
                .delete(`/api/v1/instructor/quizzes/${quizToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(204);

            // Verify deleted
            const deleted = await prisma.quiz.findUnique({
                where: { id: quizToDelete.id },
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent quiz', async () => {
            const response = await request(app)
                .delete('/api/v1/instructor/quizzes/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor quiz', async () => {
            const response = await request(app)
                .delete(`/api/v1/instructor/quizzes/${quiz.id}`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/instructor/quizzes/:id/publish', () => {
        it('should publish quiz', async () => {
            const unpublishedQuiz = await prisma.quiz.create({
                data: {
                    lessonId: lesson.id,
                    courseId: course.id,
                    title: `Unpublished Quiz ${Date.now()}`,
                    questions: [
                        {
                            id: '1',
                            question: 'Test?',
                            type: 'multiple-choice',
                            options: ['A', 'B'],
                            correctAnswer: 'A',
                        },
                    ],
                    passingScore: 70,
                    attemptsAllowed: 1,
                    isPublished: false,
                },
            });

            const response = await request(app)
                .patch(`/api/v1/instructor/quizzes/${unpublishedQuiz.id}/publish`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    isPublished: true,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isPublished).toBe(true);
        });

        it('should unpublish quiz', async () => {
            const response = await request(app)
                .patch(`/api/v1/instructor/quizzes/${quiz.id}/publish`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    isPublished: false,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isPublished).toBe(false);
        });

        it('should return 404 for non-existent quiz', async () => {
            const response = await request(app)
                .patch('/api/v1/instructor/quizzes/99999/publish')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({
                    isPublished: true,
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for other instructor quiz', async () => {
            const response = await request(app)
                .patch(`/api/v1/instructor/quizzes/${quiz.id}/publish`)
                .set('Authorization', `Bearer ${otherInstructorToken}`)
                .send({
                    isPublished: false,
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    // Note: AI generation endpoints are skipped as they require AI service configuration
    describe.skip('AI Quiz Generation', () => {
        it('should generate quiz from lesson', async () => {
            // Requires AI service
        });

        it('should generate quiz from course', async () => {
            // Requires AI service
        });
    });
});

