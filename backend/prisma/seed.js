// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Constants (matching backend/src/config/constants.js)
const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BANNED: 'BANNED',
}

const USER_ROLES = {
    ADMIN: 'ADMIN',
    INSTRUCTOR: 'INSTRUCTOR',
    STUDENT: 'STUDENT',
    GUEST: 'GUEST',
}

const ENROLLMENT_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    DROPPED: 'DROPPED',
}

const COURSE_STATUS = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
}

const COURSE_LEVEL = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
}

const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
}

const TRANSACTION_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
}

const NOTIFICATION_TYPES = {
    COURSE_ENROLLED: 'COURSE_ENROLLED',
    LESSON_COMPLETED: 'LESSON_COMPLETED',
    COURSE_COMPLETED: 'COURSE_COMPLETED',
    QUIZ_PASSED: 'QUIZ_PASSED',
    QUIZ_FAILED: 'QUIZ_FAILED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    NEW_COURSE_PUBLISHED: 'NEW_COURSE_PUBLISHED',
    COURSE_UPDATE: 'COURSE_UPDATE',
}

// Helper function to generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

async function main() {
    console.log('🌱 Starting database seeding...')
    console.log('🗑️  Cleaning existing data...')

    // Delete data in reverse order of dependencies (child tables first)
    await prisma.chatMessage.deleteMany()
    await prisma.conversation.deleteMany()
    await prisma.aiRecommendation.deleteMany()
    await prisma.quizSubmission.deleteMany()
    await prisma.quiz.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.progress.deleteMany()
    await prisma.paymentTransaction.deleteMany()
    await prisma.order.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.courseTag.deleteMany()
    await prisma.course.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Existing data cleaned')

    // ============================================
    // 1. USERS
    // ============================================
    console.log('\n📝 Creating users...')

    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 12)
    const admin = await prisma.user.create({
        data: {
            userName: 'admin',
            email: 'admin@2200freefonts.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: USER_ROLES.ADMIN,
            status: USER_STATUS.ACTIVE,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            phone: '0123456789',
            bio: 'System Administrator',
        },
    })
    console.log('✅ Admin user created:', admin.email)

    // Create Multiple Instructors
    const instructorsData = [
        {
            userName: 'instructor1',
            email: 'instructor1@2200freefonts.com',
            fullName: 'Nguyễn Văn A',
            bio: 'Full-stack developer với 10+ năm kinh nghiệm. Chuyên về React, Node.js và cloud computing.',
            phone: '0912345678',
        },
        {
            userName: 'instructor2',
            email: 'instructor2@2200freefonts.com',
            fullName: 'Trần Thị B',
            bio: 'Mobile app developer, chuyên về React Native và Flutter. Đã phát triển 50+ ứng dụng di động.',
            phone: '0923456789',
        },
        {
            userName: 'instructor3',
            email: 'instructor3@2200freefonts.com',
            fullName: 'Lê Văn C',
            bio: 'Data scientist và AI engineer. Chuyên về machine learning, deep learning và Python.',
            phone: '0934567890',
        },
    ]

    const instructors = []
    const instructorPassword = await bcrypt.hash('Instructor@123', 12)
    for (const data of instructorsData) {
        const instructor = await prisma.user.create({
            data: {
                ...data,
                passwordHash: instructorPassword,
                role: USER_ROLES.INSTRUCTOR,
                status: USER_STATUS.ACTIVE,
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        })
        instructors.push(instructor)
        console.log(`✅ Instructor created: ${instructor.email}`)
    }

    // Create Multiple Students
    const studentsData = [
        {
            userName: 'student1',
            email: 'student1@2200freefonts.com',
            fullName: 'Phạm Thị D',
            phone: '0945678901',
        },
        {
            userName: 'student2',
            email: 'student2@2200freefonts.com',
            fullName: 'Hoàng Văn E',
            phone: '0956789012',
        },
        {
            userName: 'student3',
            email: 'student3@2200freefonts.com',
            fullName: 'Vũ Thị F',
            phone: '0967890123',
        },
        {
            userName: 'student4',
            email: 'student4@2200freefonts.com',
            fullName: 'Đặng Văn G',
            phone: '0978901234',
        },
        {
            userName: 'student5',
            email: 'student5@2200freefonts.com',
            fullName: 'Bùi Thị H',
            phone: '0989012345',
        },
    ]

    const students = []
    const studentPassword = await bcrypt.hash('Student@123', 12)
    for (const data of studentsData) {
        const student = await prisma.user.create({
            data: {
                ...data,
                passwordHash: studentPassword,
                role: USER_ROLES.STUDENT,
                status: USER_STATUS.ACTIVE,
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        })
        students.push(student)
        console.log(`✅ Student created: ${student.email}`)
    }

    // ============================================
    // 2. CATEGORIES
    // ============================================
    console.log('\n📁 Creating categories...')

    const categoriesData = [
        {
            name: 'Web Development',
            slug: 'web-development',
            description: 'Học phát triển web từ cơ bản đến nâng cao',
            sortOrder: 1,
        },
        {
            name: 'Mobile Development',
            slug: 'mobile-development',
            description: 'Xây dựng ứng dụng di động với React Native, Flutter',
            sortOrder: 2,
        },
        {
            name: 'Data Science',
            slug: 'data-science',
            description: 'Khoa học dữ liệu và machine learning',
            sortOrder: 3,
        },
        {
            name: 'UI/UX Design',
            slug: 'ui-ux-design',
            description: 'Thiết kế giao diện và trải nghiệm người dùng',
            sortOrder: 4,
        },
        {
            name: 'DevOps',
            slug: 'devops',
            description: 'DevOps và cloud computing',
            sortOrder: 5,
        },
        {
            name: 'Programming Languages',
            slug: 'programming-languages',
            description: 'Ngôn ngữ lập trình cơ bản',
            sortOrder: 6,
        },
    ]

    const categories = []
    for (const data of categoriesData) {
        const category = await prisma.category.upsert({
            where: { slug: data.slug },
            update: {},
            create: {
                ...data,
                isActive: true,
            },
        })
        categories.push(category)
        console.log(`✅ Category created: ${category.name}`)
    }

    // Create subcategories
    const frontendCategory = await prisma.category.upsert({
        where: { slug: 'frontend-development' },
        update: {},
        create: {
            name: 'Frontend Development',
            slug: 'frontend-development',
            description: 'React, Vue, Angular và các framework frontend',
            parentId: categories[0].id, // Web Development
            sortOrder: 1,
            isActive: true,
        },
    })

    const backendCategory = await prisma.category.upsert({
        where: { slug: 'backend-development' },
        update: {},
        create: {
            name: 'Backend Development',
            slug: 'backend-development',
            description: 'Node.js, Python, Java và các công nghệ backend',
            parentId: categories[0].id, // Web Development
            sortOrder: 2,
            isActive: true,
        },
    })

    // ============================================
    // 3. TAGS
    // ============================================
    console.log('\n🏷️  Creating tags...')

    const tagsData = [
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'React', slug: 'react' },
        { name: 'Node.js', slug: 'nodejs' },
        { name: 'Python', slug: 'python' },
        { name: 'TypeScript', slug: 'typescript' },
        { name: 'Vue.js', slug: 'vuejs' },
        { name: 'Angular', slug: 'angular' },
        { name: 'Express', slug: 'express' },
        { name: 'MongoDB', slug: 'mongodb' },
        { name: 'PostgreSQL', slug: 'postgresql' },
        { name: 'React Native', slug: 'react-native' },
        { name: 'Flutter', slug: 'flutter' },
        { name: 'Machine Learning', slug: 'machine-learning' },
        { name: 'Deep Learning', slug: 'deep-learning' },
        { name: 'AWS', slug: 'aws' },
        { name: 'Docker', slug: 'docker' },
        { name: 'Kubernetes', slug: 'kubernetes' },
        { name: 'Git', slug: 'git' },
        { name: 'HTML', slug: 'html' },
        { name: 'CSS', slug: 'css' },
    ]

    const tags = []
    for (const data of tagsData) {
        const tag = await prisma.tag.upsert({
            where: { slug: data.slug },
            update: {},
            create: data,
        })
        tags.push(tag)
    }
    console.log(`✅ Created ${tags.length} tags`)

    // ============================================
    // 4. COURSES
    // ============================================
    console.log('\n📚 Creating courses...')

    const coursesData = [
        {
            title: 'Complete Web Development Bootcamp 2025',
            slug: 'complete-web-development-bootcamp',
            description: `Khóa học phát triển web toàn diện từ cơ bản đến nâng cao. 
Bạn sẽ học HTML, CSS, JavaScript, React, Node.js, MongoDB và nhiều công nghệ khác.
Sau khóa học, bạn sẽ có thể xây dựng các ứng dụng web hoàn chỉnh và sẵn sàng cho công việc.`,
            shortDescription:
                'Master web development với HTML, CSS, JavaScript, React, Node.js và nhiều công nghệ khác',
            price: 999000,
            discountPrice: 499000,
            instructorId: instructors[0].id,
            categoryId: categories[0].id, // Web Development
            level: COURSE_LEVEL.BEGINNER,
            durationHours: 40,
            language: 'vi',
            requirements:
                'Kỹ năng máy tính cơ bản, không cần kinh nghiệm lập trình trước đó',
            whatYouLearn:
                'HTML, CSS, JavaScript, React, Node.js, MongoDB, Git, Deployment, RESTful API, Authentication',
            courseObjectives:
                'Xây dựng 10+ dự án thực tế, Có kỹ năng sẵn sàng cho công việc, Học best practices trong ngành',
            targetAudience:
                'Người mới bắt đầu muốn trở thành web developer, Sinh viên, Người muốn chuyển nghề',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: true,
            ratingAvg: 4.8,
            ratingCount: 250,
            enrolledCount: 1500,
            viewsCount: 5000,
            completionRate: 75.5,
            publishedAt: new Date('2024-01-15'),
            courseTags: ['javascript', 'react', 'nodejs', 'html', 'css'],
        },
        {
            title: 'React - The Complete Guide (Including Hooks, React Router, Redux)',
            slug: 'react-complete-guide',
            description: `Khóa học React đầy đủ nhất. Học từ cơ bản đến nâng cao với Hooks, 
React Router, Redux, Context API và nhiều hơn nữa.`,
            shortDescription:
                'Học React từ đầu với Hooks, React Router, Redux và các công nghệ liên quan',
            price: 799000,
            discountPrice: 399000,
            instructorId: instructors[0].id,
            categoryId: frontendCategory.id,
            level: COURSE_LEVEL.INTERMEDIATE,
            durationHours: 30,
            language: 'vi',
            requirements: 'Kiến thức cơ bản về JavaScript và HTML',
            whatYouLearn:
                'React Hooks, React Router, Redux, Context API, Custom Hooks, Performance Optimization',
            courseObjectives:
                'Master React framework, Build complex applications, Understand React ecosystem',
            targetAudience: 'Developers muốn học React, Frontend developers',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: true,
            ratingAvg: 4.9,
            ratingCount: 180,
            enrolledCount: 1200,
            viewsCount: 3500,
            completionRate: 82.0,
            publishedAt: new Date('2024-02-01'),
            courseTags: ['react', 'javascript', 'typescript'],
        },
        {
            title: 'Node.js - The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
            slug: 'nodejs-complete-guide',
            description: `Học Node.js từ cơ bản đến nâng cao. Xây dựng REST APIs, GraphQL APIs,
MVC architecture, Authentication, và nhiều hơn nữa.`,
            shortDescription:
                'Master Node.js với REST APIs, GraphQL, Authentication và các best practices',
            price: 899000,
            discountPrice: 449000,
            instructorId: instructors[0].id,
            categoryId: backendCategory.id,
            level: COURSE_LEVEL.INTERMEDIATE,
            durationHours: 35,
            language: 'vi',
            requirements: 'Kiến thức JavaScript cơ bản',
            whatYouLearn:
                'Node.js, Express, REST APIs, GraphQL, MongoDB, Authentication, Security, Testing',
            courseObjectives:
                'Build scalable backend applications, Understand Node.js ecosystem, Master API development',
            targetAudience: 'Backend developers, Full-stack developers',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: false,
            ratingAvg: 4.7,
            ratingCount: 150,
            enrolledCount: 800,
            viewsCount: 2500,
            completionRate: 70.0,
            publishedAt: new Date('2024-02-15'),
            courseTags: ['nodejs', 'express', 'javascript', 'mongodb'],
        },
        {
            title: 'React Native - The Practical Guide',
            slug: 'react-native-practical-guide',
            description: `Học React Native để xây dựng ứng dụng di động cho iOS và Android.
Học Navigation, State Management, API Integration và nhiều hơn nữa.`,
            shortDescription:
                'Xây dựng ứng dụng di động với React Native cho iOS và Android',
            price: 849000,
            discountPrice: 424000,
            instructorId: instructors[1].id,
            categoryId: categories[1].id, // Mobile Development
            level: COURSE_LEVEL.INTERMEDIATE,
            durationHours: 28,
            language: 'vi',
            requirements: 'Kiến thức React và JavaScript',
            whatYouLearn:
                'React Native, Navigation, State Management, API Integration, Push Notifications, Deployment',
            courseObjectives:
                'Build mobile apps for iOS and Android, Publish apps to stores, Understand mobile development',
            targetAudience: 'React developers, Mobile developers',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: true,
            ratingAvg: 4.6,
            ratingCount: 120,
            enrolledCount: 600,
            viewsCount: 1800,
            completionRate: 68.0,
            publishedAt: new Date('2024-03-01'),
            courseTags: ['react-native', 'javascript', 'mobile'],
        },
        {
            title: 'Python for Data Science and Machine Learning Bootcamp',
            slug: 'python-data-science-ml',
            description: `Khóa học Python cho Data Science và Machine Learning.
Học NumPy, Pandas, Matplotlib, Scikit-learn, TensorFlow và nhiều hơn nữa.`,
            shortDescription:
                'Học Python cho Data Science và Machine Learning từ cơ bản đến nâng cao',
            price: 949000,
            discountPrice: 474000,
            instructorId: instructors[2].id,
            categoryId: categories[2].id, // Data Science
            level: COURSE_LEVEL.BEGINNER,
            durationHours: 45,
            language: 'vi',
            requirements: 'Không cần kinh nghiệm lập trình',
            whatYouLearn:
                'Python, NumPy, Pandas, Matplotlib, Scikit-learn, TensorFlow, Deep Learning, Data Analysis',
            courseObjectives:
                'Master Python for data science, Build ML models, Analyze data, Understand AI fundamentals',
            targetAudience: 'Data scientists, Analysts, Developers muốn học ML',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: true,
            ratingAvg: 4.8,
            ratingCount: 200,
            enrolledCount: 1000,
            viewsCount: 4000,
            completionRate: 72.0,
            publishedAt: new Date('2024-03-15'),
            courseTags: [
                'python',
                'machine-learning',
                'data-science',
                'deep-learning',
            ],
        },
        {
            title: 'Complete TypeScript Course',
            slug: 'complete-typescript-course',
            description: `Học TypeScript từ cơ bản đến nâng cao. Type system, Generics, Decorators,
và cách sử dụng TypeScript với React, Node.js.`,
            shortDescription:
                'Master TypeScript với type system, generics và integration với React, Node.js',
            price: 699000,
            discountPrice: 349000,
            instructorId: instructors[0].id,
            categoryId: categories[5].id, // Programming Languages
            level: COURSE_LEVEL.INTERMEDIATE,
            durationHours: 20,
            language: 'vi',
            requirements: 'Kiến thức JavaScript',
            whatYouLearn:
                'TypeScript, Type System, Generics, Decorators, React + TypeScript, Node.js + TypeScript',
            courseObjectives:
                'Master TypeScript, Write type-safe code, Use TypeScript in real projects',
            targetAudience:
                'JavaScript developers, Frontend/Backend developers',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: false,
            ratingAvg: 4.7,
            ratingCount: 100,
            enrolledCount: 500,
            viewsCount: 1500,
            completionRate: 65.0,
            publishedAt: new Date('2024-04-01'),
            courseTags: ['typescript', 'javascript'],
        },
        {
            title: 'Docker & Kubernetes: The Practical Guide',
            slug: 'docker-kubernetes-practical',
            description: `Học Docker và Kubernetes để containerize và orchestrate applications.
Học từ cơ bản đến production deployment.`,
            shortDescription:
                'Master Docker và Kubernetes cho containerization và orchestration',
            price: 799000,
            discountPrice: 399000,
            instructorId: instructors[0].id,
            categoryId: categories[4].id, // DevOps
            level: COURSE_LEVEL.ADVANCED,
            durationHours: 25,
            language: 'vi',
            requirements: 'Kiến thức cơ bản về Linux và command line',
            whatYouLearn:
                'Docker, Docker Compose, Kubernetes, Container Orchestration, CI/CD, Cloud Deployment',
            courseObjectives:
                'Containerize applications, Deploy with Kubernetes, Understand DevOps practices',
            targetAudience:
                'DevOps engineers, Backend developers, System administrators',
            status: COURSE_STATUS.PUBLISHED,
            isFeatured: false,
            ratingAvg: 4.6,
            ratingCount: 80,
            enrolledCount: 400,
            viewsCount: 1200,
            completionRate: 60.0,
            publishedAt: new Date('2024-04-15'),
            courseTags: ['docker', 'kubernetes', 'devops', 'aws'],
        },
        {
            title: 'Vue.js - The Complete Guide',
            slug: 'vuejs-complete-guide',
            description: `Khóa học Vue.js đầy đủ nhất. Học Vue 3, Composition API, Vue Router,
Vuex/Pinia, và xây dựng ứng dụng thực tế.`,
            shortDescription:
                'Học Vue.js 3 với Composition API, Vue Router, Vuex/Pinia từ cơ bản đến nâng cao',
            price: 749000,
            discountPrice: 374000,
            instructorId: instructors[1].id,
            categoryId: frontendCategory.id,
            level: COURSE_LEVEL.INTERMEDIATE,
            durationHours: 32,
            language: 'vi',
            requirements: 'Kiến thức JavaScript và HTML/CSS',
            whatYouLearn:
                'Vue.js 3, Composition API, Vue Router, Vuex, Pinia, Testing, Deployment',
            courseObjectives:
                'Master Vue.js framework, Build SPA applications, Understand Vue ecosystem',
            targetAudience: 'Frontend developers, JavaScript developers',
            status: COURSE_STATUS.DRAFT,
            isFeatured: false,
            ratingAvg: 0,
            ratingCount: 0,
            enrolledCount: 0,
            viewsCount: 0,
            completionRate: 0,
            publishedAt: null,
            courseTags: ['vuejs', 'javascript'],
        },
    ]

    const courses = []
    for (const data of coursesData) {
        const { courseTags, ...courseData } = data

        // Create course
        const course = await prisma.course.upsert({
            where: { slug: courseData.slug },
            update: {},
            create: courseData,
        })

        // Link tags to course
        if (courseTags && courseTags.length > 0) {
            for (const tagSlug of courseTags) {
                const tag = tags.find((t) => t.slug === tagSlug)
                if (tag) {
                    await prisma.courseTag.upsert({
                        where: {
                            courseId_tagId: {
                                courseId: course.id,
                                tagId: tag.id,
                            },
                        },
                        update: {},
                        create: {
                            courseId: course.id,
                            tagId: tag.id,
                        },
                    })
                }
            }
        }

        courses.push(course)
        console.log(`✅ Course created: ${course.title}`)
    }

    // ============================================
    // 5. LESSONS
    // ============================================
    console.log('\n📖 Creating lessons...')

    const lessonsData = [
        // Course 1: Complete Web Development Bootcamp
        {
            courseSlug: 'complete-web-development-bootcamp',
            lessons: [
                {
                    title: 'Giới thiệu về Web Development',
                    description:
                        'Chào mừng đến với khóa học! Tìm hiểu những gì bạn sẽ học và xây dựng.',
                    lessonOrder: 1,
                    isPreview: true,
                    videoDuration: 600, // 10 minutes
                },
                {
                    title: 'Thiết lập môi trường phát triển',
                    description:
                        'Cài đặt VS Code, Node.js và các công cụ cần thiết khác.',
                    lessonOrder: 2,
                    isPreview: true,
                    videoDuration: 900, // 15 minutes
                },
                {
                    title: 'HTML Fundamentals',
                    description: 'Học các thẻ HTML, elements và cấu trúc.',
                    lessonOrder: 3,
                    videoDuration: 1200, // 20 minutes
                },
                {
                    title: 'CSS Fundamentals',
                    description: 'Styling với CSS, selectors, và layout.',
                    lessonOrder: 4,
                    videoDuration: 1500, // 25 minutes
                },
                {
                    title: 'JavaScript Basics',
                    description:
                        'Biến, functions, arrays, objects trong JavaScript.',
                    lessonOrder: 5,
                    videoDuration: 1800, // 30 minutes
                },
                {
                    title: 'DOM Manipulation',
                    description:
                        'Tương tác với DOM, events, và dynamic content.',
                    lessonOrder: 6,
                    videoDuration: 2100, // 35 minutes
                },
                {
                    title: 'React Introduction',
                    description: 'Giới thiệu về React, components, và JSX.',
                    lessonOrder: 7,
                    videoDuration: 2400, // 40 minutes
                },
                {
                    title: 'React Hooks',
                    description: 'useState, useEffect, và các hooks khác.',
                    lessonOrder: 8,
                    videoDuration: 2700, // 45 minutes
                },
                {
                    title: 'Node.js Basics',
                    description: 'Giới thiệu về Node.js, npm, và modules.',
                    lessonOrder: 9,
                    videoDuration: 1800, // 30 minutes
                },
                {
                    title: 'Express.js và REST APIs',
                    description: 'Xây dựng REST APIs với Express.js.',
                    lessonOrder: 10,
                    videoDuration: 3000, // 50 minutes
                },
            ],
        },
        // Course 2: React Complete Guide
        {
            courseSlug: 'react-complete-guide',
            lessons: [
                {
                    title: 'React Basics và JSX',
                    description: 'Học React từ đầu với components và JSX.',
                    lessonOrder: 1,
                    isPreview: true,
                    videoDuration: 1200,
                },
                {
                    title: 'Components và Props',
                    description: 'Tạo và sử dụng components với props.',
                    lessonOrder: 2,
                    isPreview: true,
                    videoDuration: 1500,
                },
                {
                    title: 'State và Events',
                    description: 'Quản lý state và xử lý events trong React.',
                    lessonOrder: 3,
                    videoDuration: 1800,
                },
                {
                    title: 'React Hooks - useState',
                    description: 'Sử dụng useState hook để quản lý state.',
                    lessonOrder: 4,
                    videoDuration: 2100,
                },
                {
                    title: 'React Hooks - useEffect',
                    description: 'Sử dụng useEffect cho side effects.',
                    lessonOrder: 5,
                    videoDuration: 2400,
                },
                {
                    title: 'React Router',
                    description: 'Routing trong React với React Router.',
                    lessonOrder: 6,
                    videoDuration: 2700,
                },
                {
                    title: 'Redux Basics',
                    description: 'State management với Redux.',
                    lessonOrder: 7,
                    videoDuration: 3000,
                },
            ],
        },
        // Course 3: Node.js Complete Guide
        {
            courseSlug: 'nodejs-complete-guide',
            lessons: [
                {
                    title: 'Node.js Introduction',
                    description: 'Giới thiệu về Node.js và npm.',
                    lessonOrder: 1,
                    isPreview: true,
                    videoDuration: 900,
                },
                {
                    title: 'Modules và File System',
                    description: 'Sử dụng modules và làm việc với file system.',
                    lessonOrder: 2,
                    videoDuration: 1200,
                },
                {
                    title: 'Express.js Setup',
                    description: 'Thiết lập Express.js server.',
                    lessonOrder: 3,
                    videoDuration: 1500,
                },
                {
                    title: 'RESTful APIs',
                    description: 'Xây dựng RESTful APIs với Express.',
                    lessonOrder: 4,
                    videoDuration: 2400,
                },
                {
                    title: 'Database Integration',
                    description: 'Kết nối và sử dụng MongoDB với Mongoose.',
                    lessonOrder: 5,
                    videoDuration: 2700,
                },
                {
                    title: 'Authentication và Security',
                    description:
                        'Implement authentication và security best practices.',
                    lessonOrder: 6,
                    videoDuration: 3000,
                },
            ],
        },
    ]

    for (const courseLessons of lessonsData) {
        const course = courses.find((c) => c.slug === courseLessons.courseSlug)
        if (!course) continue

        for (const lessonData of courseLessons.lessons) {
            const slug = generateSlug(lessonData.title)
            await prisma.lesson.upsert({
                where: {
                    courseId_slug: {
                        courseId: course.id,
                        slug: slug,
                    },
                },
                update: {},
                create: {
                    ...lessonData,
                    courseId: course.id,
                    slug: slug,
                    isPublished: true,
                },
            })
        }
        console.log(
            `✅ Created ${courseLessons.lessons.length} lessons for: ${course.title}`
        )
    }

    // Update course totalLessons
    for (const course of courses) {
        const lessonCount = await prisma.lesson.count({
            where: { courseId: course.id },
        })
        await prisma.course.update({
            where: { id: course.id },
            data: { totalLessons: lessonCount },
        })
    }

    // ============================================
    // 6. ENROLLMENTS
    // ============================================
    console.log('\n🎓 Creating enrollments...')

    // Student 1 enrolls in multiple courses
    const enrollmentsData = [
        {
            studentEmail: 'student1@2200freefonts.com',
            courseSlug: 'complete-web-development-bootcamp',
            progressPercentage: 45.5,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-01-20'),
            startedAt: new Date('2024-01-21'),
        },
        {
            studentEmail: 'student1@2200freefonts.com',
            courseSlug: 'react-complete-guide',
            progressPercentage: 30.0,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-02-05'),
            startedAt: new Date('2024-02-06'),
        },
        {
            studentEmail: 'student2@2200freefonts.com',
            courseSlug: 'complete-web-development-bootcamp',
            progressPercentage: 75.0,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-01-18'),
            startedAt: new Date('2024-01-19'),
        },
        {
            studentEmail: 'student2@2200freefonts.com',
            courseSlug: 'nodejs-complete-guide',
            progressPercentage: 20.0,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-02-20'),
            startedAt: new Date('2024-02-21'),
        },
        {
            studentEmail: 'student3@2200freefonts.com',
            courseSlug: 'react-native-practical-guide',
            progressPercentage: 50.0,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-03-05'),
            startedAt: new Date('2024-03-06'),
        },
        {
            studentEmail: 'student4@2200freefonts.com',
            courseSlug: 'python-data-science-ml',
            progressPercentage: 60.0,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: new Date('2024-03-20'),
            startedAt: new Date('2024-03-21'),
        },
    ]

    for (const enrollmentData of enrollmentsData) {
        const student = students.find(
            (s) => s.email === enrollmentData.studentEmail
        )
        const course = courses.find((c) => c.slug === enrollmentData.courseSlug)

        if (student && course) {
            await prisma.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: student.id,
                        courseId: course.id,
                    },
                },
                update: {},
                create: {
                    userId: student.id,
                    courseId: course.id,
                    progressPercentage: enrollmentData.progressPercentage,
                    status: enrollmentData.status,
                    enrolledAt: enrollmentData.enrolledAt,
                    startedAt: enrollmentData.startedAt,
                    lastAccessedAt: new Date(),
                },
            })
        }
    }
    console.log(`✅ Created ${enrollmentsData.length} enrollments`)

    // Update course enrolledCount
    for (const course of courses) {
        const enrollmentCount = await prisma.enrollment.count({
            where: { courseId: course.id },
        })
        await prisma.course.update({
            where: { id: course.id },
            data: { enrolledCount: enrollmentCount },
        })
    }

    // ============================================
    // 7. ORDERS
    // ============================================
    console.log('\n💳 Creating orders...')

    const ordersData = [
        {
            studentEmail: 'student1@2200freefonts.com',
            courseSlug: 'complete-web-development-bootcamp',
            orderCode: 'ORD-20240120-001',
            originalPrice: 999000,
            discountAmount: 500000,
            finalPrice: 499000,
            paymentMethod: 'bank_transfer',
            paymentGateway: 'vnpay',
            paymentStatus: PAYMENT_STATUS.PAID,
            transactionId: 'TXN-20240120-001',
            paidAt: new Date('2024-01-20'),
        },
        {
            studentEmail: 'student1@2200freefonts.com',
            courseSlug: 'react-complete-guide',
            orderCode: 'ORD-20240205-001',
            originalPrice: 799000,
            discountAmount: 400000,
            finalPrice: 399000,
            paymentMethod: 'credit_card',
            paymentGateway: 'vnpay',
            paymentStatus: PAYMENT_STATUS.PAID,
            transactionId: 'TXN-20240205-001',
            paidAt: new Date('2024-02-05'),
        },
        {
            studentEmail: 'student2@2200freefonts.com',
            courseSlug: 'complete-web-development-bootcamp',
            orderCode: 'ORD-20240118-001',
            originalPrice: 999000,
            discountAmount: 500000,
            finalPrice: 499000,
            paymentMethod: 'bank_transfer',
            paymentGateway: 'vnpay',
            paymentStatus: PAYMENT_STATUS.PAID,
            transactionId: 'TXN-20240118-001',
            paidAt: new Date('2024-01-18'),
        },
        {
            studentEmail: 'student2@2200freefonts.com',
            courseSlug: 'nodejs-complete-guide',
            orderCode: 'ORD-20240220-001',
            originalPrice: 899000,
            discountAmount: 450000,
            finalPrice: 449000,
            paymentMethod: 'credit_card',
            paymentGateway: 'vnpay',
            paymentStatus: PAYMENT_STATUS.PENDING,
            transactionId: null,
            paidAt: null,
        },
        {
            studentEmail: 'student3@2200freefonts.com',
            courseSlug: 'react-native-practical-guide',
            orderCode: 'ORD-20240305-001',
            originalPrice: 849000,
            discountAmount: 425000,
            finalPrice: 424000,
            paymentMethod: 'bank_transfer',
            paymentGateway: 'vnpay',
            paymentStatus: PAYMENT_STATUS.PAID,
            transactionId: 'TXN-20240305-001',
            paidAt: new Date('2024-03-05'),
        },
    ]

    for (const orderData of ordersData) {
        const student = students.find((s) => s.email === orderData.studentEmail)
        const course = courses.find((c) => c.slug === orderData.courseSlug)

        if (student && course) {
            const {
                transactionId,
                paidAt,
                studentEmail,
                courseSlug,
                ...orderFields
            } = orderData
            const order = await prisma.order.upsert({
                where: { orderCode: orderData.orderCode },
                update: {},
                create: {
                    ...orderFields,
                    userId: student.id,
                    courseId: course.id,
                    transactionId: transactionId || undefined,
                    paidAt: paidAt || undefined,
                },
            })

            // Create payment transaction if paid
            if (
                orderData.paymentStatus === PAYMENT_STATUS.PAID &&
                transactionId
            ) {
                await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        transactionId: transactionId,
                        paymentGateway: orderData.paymentGateway,
                        amount: orderData.finalPrice,
                        currency: 'VND',
                        status: TRANSACTION_STATUS.SUCCESS,
                        createdAt: paidAt,
                    },
                })
            }
        }
    }
    console.log(`✅ Created ${ordersData.length} orders`)

    // ============================================
    // 8. PROGRESS
    // ============================================
    console.log('\n📊 Creating progress records...')

    // Get lessons for progress
    const course1Lessons = await prisma.lesson.findMany({
        where: { courseId: courses[0].id },
        orderBy: { lessonOrder: 'asc' },
    })

    // Student 1 progress in course 1 (completed first 4 lessons)
    const student1 = students.find(
        (s) => s.email === 'student1@2200freefonts.com'
    )
    if (student1 && course1Lessons.length >= 4) {
        for (let i = 0; i < 4; i++) {
            await prisma.progress.upsert({
                where: {
                    userId_lessonId: {
                        userId: student1.id,
                        lessonId: course1Lessons[i].id,
                    },
                },
                update: {},
                create: {
                    userId: student1.id,
                    lessonId: course1Lessons[i].id,
                    courseId: courses[0].id,
                    isCompleted: true,
                    completedAt: new Date(),
                    watchDuration: course1Lessons[i].videoDuration || 0,
                    lastPosition: course1Lessons[i].videoDuration || 0,
                    attemptsCount: 1,
                },
            })
        }

        // Student 1 watching lesson 5 (not completed)
        if (course1Lessons[4]) {
            await prisma.progress.upsert({
                where: {
                    userId_lessonId: {
                        userId: student1.id,
                        lessonId: course1Lessons[4].id,
                    },
                },
                update: {},
                create: {
                    userId: student1.id,
                    lessonId: course1Lessons[4].id,
                    courseId: courses[0].id,
                    isCompleted: false,
                    watchDuration: 600, // 10 minutes
                    lastPosition: 600,
                    attemptsCount: 1,
                },
            })
        }
    }

    // Student 2 progress in course 1 (completed more lessons)
    const student2 = students.find(
        (s) => s.email === 'student2@2200freefonts.com'
    )
    if (student2 && course1Lessons.length >= 7) {
        for (let i = 0; i < 7; i++) {
            await prisma.progress.upsert({
                where: {
                    userId_lessonId: {
                        userId: student2.id,
                        lessonId: course1Lessons[i].id,
                    },
                },
                update: {},
                create: {
                    userId: student2.id,
                    lessonId: course1Lessons[i].id,
                    courseId: courses[0].id,
                    isCompleted: true,
                    completedAt: new Date(),
                    watchDuration: course1Lessons[i].videoDuration || 0,
                    lastPosition: course1Lessons[i].videoDuration || 0,
                    attemptsCount: 1,
                },
            })
        }
    }

    console.log('✅ Created progress records')

    // ============================================
    // 9. NOTIFICATIONS
    // ============================================
    console.log('\n🔔 Creating notifications...')

    const notificationsData = [
        {
            userEmail: 'student1@2200freefonts.com',
            type: NOTIFICATION_TYPES.COURSE_ENROLLED,
            title: 'Đăng ký khóa học thành công',
            message:
                'Bạn đã đăng ký thành công khóa học "Complete Web Development Bootcamp 2025"',
            relatedId: courses[0].id,
            relatedType: 'course',
        },
        {
            userEmail: 'student1@2200freefonts.com',
            type: NOTIFICATION_TYPES.LESSON_COMPLETED,
            title: 'Hoàn thành bài học',
            message:
                'Bạn đã hoàn thành bài học "Giới thiệu về Web Development"',
            relatedId: course1Lessons[0]?.id,
            relatedType: 'lesson',
        },
        {
            userEmail: 'student2@2200freefonts.com',
            type: NOTIFICATION_TYPES.COURSE_ENROLLED,
            title: 'Đăng ký khóa học thành công',
            message:
                'Bạn đã đăng ký thành công khóa học "Complete Web Development Bootcamp 2025"',
            relatedId: courses[0].id,
            relatedType: 'course',
        },
        {
            userEmail: 'instructor1@2200freefonts.com',
            type: NOTIFICATION_TYPES.NEW_COURSE_PUBLISHED,
            title: 'Khóa học đã được xuất bản',
            message:
                'Khóa học "Complete Web Development Bootcamp 2025" của bạn đã được xuất bản thành công',
            relatedId: courses[0].id,
            relatedType: 'course',
            isRead: true,
            readAt: new Date(),
        },
    ]

    for (const notifData of notificationsData) {
        const user = [...students, ...instructors].find(
            (u) => u.email === notifData.userEmail
        )
        if (user) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: notifData.type,
                    title: notifData.title,
                    message: notifData.message,
                    relatedId: notifData.relatedId,
                    relatedType: notifData.relatedType,
                    isRead: notifData.isRead || false,
                    readAt: notifData.readAt || null,
                },
            })
        }
    }
    console.log(`✅ Created ${notificationsData.length} notifications`)

    // ============================================
    // 10. QUIZZES
    // ============================================
    console.log('\n📝 Creating quizzes...')

    // Create quiz for first lesson of course 1
    if (course1Lessons.length > 0) {
        const quiz = await prisma.quiz.create({
            data: {
                lessonId: course1Lessons[0].id,
                courseId: courses[0].id,
                title: 'Quiz: Giới thiệu về Web Development',
                description:
                    'Kiểm tra kiến thức của bạn về bài học "Giới thiệu về Web Development"',
                questions: [
                    {
                        id: 1,
                        question: 'Web Development bao gồm những phần nào?',
                        type: 'multiple_choice',
                        options: [
                            'Frontend và Backend',
                            'Chỉ Frontend',
                            'Chỉ Backend',
                            'Không có gì',
                        ],
                        correctAnswer: 0,
                        points: 10,
                    },
                    {
                        id: 2,
                        question: 'HTML là viết tắt của gì?',
                        type: 'multiple_choice',
                        options: [
                            'HyperText Markup Language',
                            'High Tech Modern Language',
                            'Home Tool Markup Language',
                            'Hyperlink and Text Markup Language',
                        ],
                        correctAnswer: 0,
                        points: 10,
                    },
                    {
                        id: 3,
                        question:
                            'JavaScript là ngôn ngữ lập trình phía client?',
                        type: 'true_false',
                        options: ['Đúng', 'Sai'],
                        correctAnswer: 0,
                        points: 10,
                    },
                ],
                passingScore: 70,
                attemptsAllowed: 3,
                isPublished: true,
            },
        })
        console.log(`✅ Created quiz: ${quiz.title}`)

        // Create quiz submission for student 1
        if (student1) {
            await prisma.quizSubmission.create({
                data: {
                    userId: student1.id,
                    quizId: quiz.id,
                    answers: [
                        { questionId: 1, answer: 0 },
                        { questionId: 2, answer: 0 },
                        { questionId: 3, answer: 0 },
                    ],
                    score: 100,
                    isPassed: true,
                    submittedAt: new Date(),
                },
            })
            console.log('✅ Created quiz submission for student1')
        }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log('-------------------')
    console.log(`✅ Users: ${1 + instructors.length + students.length}`)
    console.log(`   - Admin: 1`)
    console.log(`   - Instructors: ${instructors.length}`)
    console.log(`   - Students: ${students.length}`)
    console.log(`✅ Categories: ${categories.length + 2}`)
    console.log(`✅ Tags: ${tags.length}`)
    console.log(`✅ Courses: ${courses.length}`)
    const totalLessons = await prisma.lesson.count()
    console.log(`✅ Lessons: ${totalLessons}`)
    const totalEnrollments = await prisma.enrollment.count()
    console.log(`✅ Enrollments: ${totalEnrollments}`)
    const totalOrders = await prisma.order.count()
    console.log(`✅ Orders: ${totalOrders}`)
    const totalProgress = await prisma.progress.count()
    console.log(`✅ Progress records: ${totalProgress}`)
    const totalNotifications = await prisma.notification.count()
    console.log(`✅ Notifications: ${totalNotifications}`)
    const totalQuizzes = await prisma.quiz.count()
    console.log(`✅ Quizzes: ${totalQuizzes}`)

    console.log('\n📋 Test Accounts:')
    console.log('-------------------')
    console.log('Admin:')
    console.log('  Email: admin@2200freefonts.com')
    console.log('  Password: Admin@123')
    console.log('\nInstructors:')
    instructors.forEach((inst, idx) => {
        console.log(`  ${idx + 1}. ${inst.email} (Password: Instructor@123)`)
    })
    console.log('\nStudents:')
    students.forEach((student, idx) => {
        console.log(`  ${idx + 1}. ${student.email} (Password: Student@123)`)
    })
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
