// src/__tests__/api/tags.test.js
import request from 'supertest';
import app from '../../app.js';
import {
    createTestUser,
    createTestInstructor,
    createTestTag,
    createTestCategory,
    createTestCourse,
    generateTestToken,
    cleanupTestData,
} from '../helpers/test-helpers.js';
import { prisma } from '../../config/database.config.js';
import { USER_ROLES, COURSE_STATUS } from '../../config/constants.js';

describe('Tags API', () => {
    let instructor;
    let instructorToken;
    let tag;
    let category;
    let course;

    beforeEach(async () => {
        // Create instructor for authenticated requests
        instructor = await createTestInstructor();
        instructorToken = generateTestToken(instructor);

        // Create a test category
        category = await createTestCategory({
            name: `Test Category ${Date.now()}`,
            slug: `test-category-${Date.now()}`,
        });

        // Create a test tag
        tag = await createTestTag({
            name: `Test Tag ${Date.now()}`,
            slug: `test-tag-${Date.now()}`,
        });

        // Create a test course with tag
        course = await createTestCourse(instructor.id, {
            categoryId: category.id,
            status: COURSE_STATUS.PUBLISHED,
        });

        // Add tag to course
        await prisma.courseTag.create({
            data: {
                courseId: course.id,
                tagId: tag.id,
            },
        });
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe('GET /api/v1/tags', () => {
        it('should get all tags', async () => {
            const response = await request(app)
                .get('/api/v1/tags')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.tags).toBeDefined();
            expect(Array.isArray(response.body.data.tags)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should get tags with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/tags?page=1&limit=5')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.tags.length).toBeLessThanOrEqual(5);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
        });

        it('should search tags by name', async () => {
            const searchTerm = `SearchTag${Date.now()}`;
            const searchTag = await createTestTag({
                name: searchTerm,
                slug: `search-tag-${Date.now()}`,
            });

            const response = await request(app)
                .get(`/api/v1/tags?search=${searchTerm}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.tags.some((t) => t.id === searchTag.id)
            ).toBe(true);
        });

        it('should search tags by slug', async () => {
            const searchSlug = `search-slug-${Date.now()}`;
            const searchTag = await createTestTag({
                name: `Search Tag ${Date.now()}`,
                slug: searchSlug,
            });

            const response = await request(app)
                .get(`/api/v1/tags?search=${searchSlug}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.tags.some((t) => t.id === searchTag.id)
            ).toBe(true);
        });
    });

    describe('GET /api/v1/tags/:id', () => {
        it('should get tag by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/tags/${tag.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(tag.id);
            expect(response.body.data.name).toBe(tag.name);
            expect(response.body.data.slug).toBe(tag.slug);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .get('/api/v1/tags/99999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(
                response.body.error?.message?.toLowerCase().includes('not found')
            ).toBe(true);
        });

        it('should return 422 for invalid tag ID', async () => {
            const response = await request(app)
                .get('/api/v1/tags/invalid')
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/tags/:id/courses', () => {
        it('should get courses by tag ID', async () => {
            const response = await request(app)
                .get(`/api/v1/tags/${tag.id}/courses`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.tag).toBeDefined();
            expect(response.body.data.courses).toBeDefined();
            expect(Array.isArray(response.body.data.courses)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should filter courses by level', async () => {
            const response = await request(app)
                .get(`/api/v1/tags/${tag.id}/courses?level=BEGINNER`)
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.courses.length > 0) {
                expect(response.body.data.courses[0].level).toBe('BEGINNER');
            }
        });

        it('should sort courses by newest', async () => {
            const response = await request(app)
                .get(`/api/v1/tags/${tag.id}/courses?sort=newest`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should sort courses by popular', async () => {
            const response = await request(app)
                .get(`/api/v1/tags/${tag.id}/courses?sort=popular`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .get('/api/v1/tags/99999/courses')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/tags', () => {
        it('should create a new tag', async () => {
            const newTag = {
                name: `New Tag ${Date.now()}`,
                slug: `new-tag-${Date.now()}`,
                description: 'Test description',
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(newTag)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.name).toBe(newTag.name);
            expect(response.body.data.slug).toBe(newTag.slug);
        });

        it('should return 401 without authentication', async () => {
            const newTag = {
                name: 'New Tag',
                slug: 'new-tag',
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .send(newTag)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 403 for non-instructor user', async () => {
            const student = await createTestUser();
            const studentToken = generateTestToken(student);

            const newTag = {
                name: 'New Tag',
                slug: 'new-tag',
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(newTag)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for duplicate slug', async () => {
            const newTag = {
                name: 'Duplicate Tag',
                slug: tag.slug, // Use existing slug
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(newTag)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for duplicate name', async () => {
            const newTag = {
                name: tag.name, // Use existing name
                slug: `different-slug-${Date.now()}`,
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(newTag)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 422 for invalid slug format', async () => {
            const newTag = {
                name: 'Invalid Tag',
                slug: 'Invalid Slug With Spaces!',
            };

            const response = await request(app)
                .post('/api/v1/tags')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(newTag)
                .expect(422);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/tags/:id', () => {
        it('should update tag', async () => {
            const updateData = {
                name: `Updated Tag Name ${Date.now()}`,
                description: 'Updated description',
            };

            const response = await request(app)
                .put(`/api/v1/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.description).toBe(updateData.description);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put(`/api/v1/tags/${tag.id}`)
                .send({ name: 'Updated' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .put('/api/v1/tags/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ name: 'Updated' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for duplicate slug', async () => {
            const otherTag = await createTestTag({
                name: `Other Tag ${Date.now()}`,
                slug: `other-tag-${Date.now()}`,
            });

            const response = await request(app)
                .put(`/api/v1/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ slug: otherTag.slug })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for duplicate name', async () => {
            const otherTag = await createTestTag({
                name: `Other Tag ${Date.now()}`,
                slug: `other-tag-${Date.now()}`,
            });

            const response = await request(app)
                .put(`/api/v1/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ name: otherTag.name })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/tags/:id', () => {
        it('should delete tag', async () => {
            const tagToDelete = await createTestTag({
                name: `Delete Tag ${Date.now()}`,
                slug: `delete-tag-${Date.now()}`,
            });

            const response = await request(app)
                .delete(`/api/v1/tags/${tagToDelete.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Tag deleted successfully');

            // Verify tag is deleted
            const deletedTag = await prisma.tag.findUnique({
                where: { id: tagToDelete.id },
            });
            expect(deletedTag).toBeNull();
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/v1/tags/${tag.id}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .delete('/api/v1/tags/99999')
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should allow deleting tag even if it has courses', async () => {
            // Tag already has a course from beforeEach
            const response = await request(app)
                .delete(`/api/v1/tags/${tag.id}`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Tag deleted successfully');

            // Verify tag is deleted
            const deletedTag = await prisma.tag.findUnique({
                where: { id: tag.id },
            });
            expect(deletedTag).toBeNull();
        });
    });
});

