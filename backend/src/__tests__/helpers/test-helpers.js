// Test helpers and utilities
import { prisma } from '../../config/database.config.js';
import BcryptUtil from '../../utils/bcrypt.util.js';
import JWTUtil from '../../utils/jwt.util.js';
import { USER_ROLES, USER_STATUS } from '../../config/constants.js';

/**
 * Create a test user
 */
export async function createTestUser(data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
        userName: `testuser_${uniqueId}`,
        email: `test_${uniqueId}@test.com`,
        password: 'Test@123456',
        fullName: 'Test User',
        role: USER_ROLES.STUDENT,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
    };

    const userData = { ...defaultData, ...data };
    
    // Hash password
    const passwordHash = await BcryptUtil.hash(userData.password);
    
    // Remove password field (Prisma schema uses passwordHash, not password)
    const { password, ...userDataWithoutPassword } = userData;

    const user = await prisma.user.create({
        data: {
            ...userDataWithoutPassword,
            passwordHash,
            tokenVersion: 0,
        },
    });

    return user;
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return createTestUser({
        userName: `admin_${uniqueId}`,
        email: `admin_${uniqueId}@test.com`,
        role: USER_ROLES.ADMIN,
        ...data,
    });
}

/**
 * Create a test instructor
 */
export async function createTestInstructor(data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return createTestUser({
        userName: `instructor_${uniqueId}`,
        email: `instructor_${uniqueId}@test.com`,
        role: USER_ROLES.INSTRUCTOR,
        ...data,
    });
}

/**
 * Generate auth token for test user
 */
export function generateTestToken(user) {
    return JWTUtil.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
    });
}

/**
 * Create a test category
 */
export async function createTestCategory(data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
        name: `Test Category ${uniqueId}`,
        slug: `test-category-${uniqueId}`,
        description: 'Test category description',
        isActive: true,
    };

    // Ensure slug is always unique even if overridden
    const finalData = { ...defaultData, ...data };
    if (data.slug && data.slug !== defaultData.slug) {
        finalData.slug = `${data.slug}-${uniqueId}`;
    }

    return prisma.category.create({
        data: finalData,
    });
}

/**
 * Create a test tag
 */
export async function createTestTag(data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
        name: `Test Tag ${uniqueId}`,
        slug: `test-tag-${uniqueId}`,
        description: 'Test tag description',
    };

    // Ensure slug is always unique even if overridden
    const finalData = { ...defaultData, ...data };
    if (data.slug && data.slug !== defaultData.slug) {
        finalData.slug = `${data.slug}-${uniqueId}`;
    }

    return prisma.tag.create({
        data: finalData,
    });
}

/**
 * Create a test course
 */
export async function createTestCourse(instructorId, data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
        title: `Test Course ${uniqueId}`,
        slug: `test-course-${uniqueId}`,
        description: 'Test course description',
        shortDescription: 'Short description',
        price: 499000,
        discountPrice: 299000,
        instructorId,
        categoryId: 1, // Will need to create category first
        level: 'BEGINNER',
        durationHours: 10,
        language: 'vi',
        status: 'DRAFT',
        isFeatured: false,
    };

    // Ensure slug is always unique even if overridden
    const finalData = { ...defaultData, ...data };
    if (data.slug && data.slug !== defaultData.slug) {
        finalData.slug = `${data.slug}-${uniqueId}`;
    }

    return prisma.course.create({
        data: finalData,
    });
}

/**
 * Create a test lesson
 */
export async function createTestLesson(courseId, data = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultData = {
        title: `Test Lesson ${uniqueId}`,
        slug: `test-lesson-${uniqueId}`,
        description: 'Test lesson description',
        content: 'Test lesson content',
        courseId,
        lessonOrder: 1,
        videoUrl: 'https://example.com/video.mp4',
        videoDuration: 600, // 10 minutes in seconds
        isPublished: true,
        isPreview: false,
    };

    // Ensure slug is always unique even if overridden
    const finalData = { ...defaultData, ...data };
    if (data.slug && data.slug !== defaultData.slug) {
        finalData.slug = `${data.slug}-${uniqueId}`;
    }

    return prisma.lesson.create({
        data: finalData,
    });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
    try {
        // Get test users first
        const testUsers = await prisma.user.findMany({
            where: { email: { contains: '@test.com' } },
            select: { id: true },
        });

        const userIds = testUsers.length > 0 ? testUsers.map(u => u.id) : [];

        // Delete in reverse order of dependencies
        // Get conversation IDs first, then delete chat messages
        if (userIds.length > 0) {
            const conversations = await prisma.conversation.findMany({
                where: { userId: { in: userIds } },
                select: { id: true },
            });

            if (conversations.length > 0) {
                const conversationIds = conversations.map(c => c.id);
                await prisma.chatMessage.deleteMany({
                    where: { conversationId: { in: conversationIds } },
                });
            }

            // Delete conversations
            await prisma.conversation.deleteMany({
                where: { userId: { in: userIds } },
            });

            // Delete quiz submissions
            await prisma.quizSubmission.deleteMany({
                where: { userId: { in: userIds } },
            });

            // Delete progress
            await prisma.progress.deleteMany({
                where: { userId: { in: userIds } },
            });

            // Delete enrollments
            await prisma.enrollment.deleteMany({
                where: { userId: { in: userIds } },
            });

            // Delete orders
            await prisma.order.deleteMany({
                where: { userId: { in: userIds } },
            });
        }

        // Delete test courses (by title pattern or instructor)
        await prisma.course.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'Test Course' } },
                    { slug: { contains: 'test-course' } },
                    ...(userIds.length > 0 ? [{ instructorId: { in: userIds } }] : []),
                ],
            },
        });

        // Delete test categories
        await prisma.category.deleteMany({
            where: {
                OR: [
                    { name: { contains: 'Test Category' } },
                    { slug: { contains: 'test-category' } },
                ],
            },
        });

        // Delete test tags
        await prisma.tag.deleteMany({
            where: {
                OR: [
                    { name: { contains: 'Test Tag' } },
                    { slug: { contains: 'test-tag' } },
                ],
            },
        });

        // Delete test users
        if (userIds.length > 0) {
            await prisma.user.deleteMany({
                where: { email: { contains: '@test.com' } },
            });
        }
    } catch (error) {
        // Ignore cleanup errors in tests
        console.warn('Cleanup warning:', error.message);
    }
}

/**
 * Wait for async operations
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

