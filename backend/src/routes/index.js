// src/routes/index.js
import express from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './users.routes.js'
import courseRoutes from './course.routes.js'
import categoryRoutes from './category.routes.js'
import tagsRoutes from './tags.routes.js'
import lessonsRoutes from './lessons.routes.js'
import instructorRoutes from './instructor.routes.js'
import instructorCourseRoutes from './instructor-course.routes.js'
import adminCourseRoutes from './admin-course.routes.js'
import enrollmentRoutes from './enrollment.routes.js'
import progressRoutes from './progress.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import ordersRoutes from './orders.routes.js'
import adminOrderRoutes from './admin-order.routes.js'
import paymentsRoutes from './payments.routes.js'
import transactionsRoutes from './transactions.routes.js'
import notificationsRoutes from './notifications.routes.js'

const router = express.Router()

// Root API endpoint
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'LMS AI Pay API',
        version: 'v1',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/v1/health',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            courses: '/api/v1/courses',
            categories: '/api/v1/categories',
            tags: '/api/v1/tags',
            lessons: '/api/v1/lessons',
            instructorCourses: '/api/v1/instructor/courses',
            instructorLessons: '/api/v1/instructor/courses/:courseId/lessons',
            adminCourses: '/api/v1/admin/courses',
            enrollments: '/api/v1/enrollments',
            progress: '/api/v1/progress',
            dashboard: '/api/v1/dashboard',
            orders: '/api/v1/orders',
            adminOrders: '/api/v1/admin/orders',
            payments: '/api/v1/payments',
            transactions: '/api/v1/transactions',
            notifications: '/api/v1/notifications',
            // More endpoints will be available when routes are enabled
        },
    })
})

// Health check for API
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
    })
})

// API Routes (uncomment when routes are ready)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/courses', courseRoutes)
router.use('/categories', categoryRoutes)
router.use('/tags', tagsRoutes)
router.use('/lessons', lessonsRoutes)
router.use('/instructor', instructorRoutes)
router.use('/instructor/courses', instructorCourseRoutes)
router.use('/admin/courses', adminCourseRoutes)
router.use('/enrollments', enrollmentRoutes)
router.use('/progress', progressRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/orders', ordersRoutes)
router.use('/admin/orders', adminOrderRoutes)
router.use('/payments', paymentsRoutes)
router.use('/transactions', transactionsRoutes)
router.use('/notifications', notificationsRoutes)

// Additional routes can be added here
// router.use('/enrollments', enrollmentRoutes)
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/quizzes', quizRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/ai', aiRoutes);
// router.use('/search', searchRoutes);

export default router
