// src/routes/index.js
const express = require('express')
// const authRoutes = require('./auth.routes')
// const userRoutes = require('./user.routes')
// const courseRoutes = require('./course.routes')
// const categoryRoutes = require('./category.routes')

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
// router.use('/auth', authRoutes)
// router.use('/users', userRoutes)
// router.use('/courses', courseRoutes)
// router.use('/categories', categoryRoutes)

// Additional routes can be added here
// router.use('/lessons', lessonRoutes);
// router.use('/enrollments', enrollmentRoutes);
// router.use('/orders', orderRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/progress', progressRoutes);
// router.use('/quizzes', quizRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/ai', aiRoutes);
// router.use('/dashboard', dashboardRoutes);
// router.use('/search', searchRoutes);

module.exports = router
