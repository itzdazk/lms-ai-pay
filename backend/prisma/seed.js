// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding...')

    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@elearning.com' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@elearning.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
        },
    })
    console.log('✅ Admin user created:', admin.email)

    // Create Instructor User
    const instructorPassword = await bcrypt.hash('Instructor@123', 12)
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor@elearning.com' },
        update: {},
        create: {
            username: 'instructor1',
            email: 'instructor@elearning.com',
            passwordHash: instructorPassword,
            fullName: 'John Instructor',
            role: 'INSTRUCTOR',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            bio: 'Experienced web development instructor with 10+ years of experience',
        },
    })
    console.log('✅ Instructor user created:', instructor.email)

    // Create Student User
    const studentPassword = await bcrypt.hash('Student@123', 12)
    const student = await prisma.user.upsert({
        where: { email: 'student@elearning.com' },
        update: {},
        create: {
            username: 'student1',
            email: 'student@elearning.com',
            passwordHash: studentPassword,
            fullName: 'Jane Student',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
        },
    })
    console.log('✅ Student user created:', student.email)

    // Create Categories
    const webDev = await prisma.category.upsert({
        where: { slug: 'web-development' },
        update: {},
        create: {
            name: 'Web Development',
            slug: 'web-development',
            description: 'Learn web development from scratch',
            isActive: true,
            sortOrder: 1,
        },
    })

    const mobile = await prisma.category.upsert({
        where: { slug: 'mobile-development' },
        update: {},
        create: {
            name: 'Mobile Development',
            slug: 'mobile-development',
            description: 'Build mobile applications',
            isActive: true,
            sortOrder: 2,
        },
    })

    const dataScience = await prisma.category.upsert({
        where: { slug: 'data-science' },
        update: {},
        create: {
            name: 'Data Science',
            slug: 'data-science',
            description: 'Master data science and machine learning',
            isActive: true,
            sortOrder: 3,
        },
    })

    console.log('✅ Categories created')

    // Create Tags
    const tags = [
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'React', slug: 'react' },
        { name: 'Node.js', slug: 'nodejs' },
        { name: 'Python', slug: 'python' },
        { name: 'TypeScript', slug: 'typescript' },
    ]

    for (const tag of tags) {
        await prisma.tag.upsert({
            where: { slug: tag.slug },
            update: {},
            create: tag,
        })
    }
    console.log('✅ Tags created')

    // Create Sample Course
    const course = await prisma.course.upsert({
        where: { slug: 'complete-web-development-bootcamp' },
        update: {},
        create: {
            title: 'Complete Web Development Bootcamp 2025',
            slug: 'complete-web-development-bootcamp',
            description:
                'Learn web development from beginner to advanced level. Build real-world projects.',
            shortDescription:
                'Master web development with HTML, CSS, JavaScript, React, Node.js and more',
            price: 999000,
            discountPrice: 499000,
            instructorId: instructor.id,
            categoryId: webDev.id,
            level: 'BEGINNER',
            durationHours: 40,
            language: 'vi',
            requirements:
                'Basic computer skills, No programming experience required',
            whatYouLearn:
                'HTML, CSS, JavaScript, React, Node.js, MongoDB, Git, Deployment',
            courseObjectives:
                'Build 10+ real projects, Get job-ready skills, Learn industry best practices',
            targetAudience:
                'Beginners who want to become web developers, Students, Career changers',
            status: 'PUBLISHED',
            isFeatured: true,
            ratingAvg: 4.8,
            ratingCount: 250,
            enrolledCount: 1500,
            viewsCount: 5000,
            completionRate: 75.5,
            publishedAt: new Date(),
        },
    })
    console.log('✅ Sample course created:', course.title)

    // Create Lessons for the course
    const lessons = [
        {
            title: 'Introduction to Web Development',
            slug: 'introduction-to-web-development',
            description: 'Welcome to the course! Learn what you will build.',
            courseId: course.id,
            lessonOrder: 1,
            isPreview: true,
            videoDuration: 600,
        },
        {
            title: 'Setting Up Your Development Environment',
            slug: 'setting-up-development-environment',
            description: 'Install VS Code, Node.js, and other essential tools.',
            courseId: course.id,
            lessonOrder: 2,
            isPreview: true,
            videoDuration: 900,
        },
        {
            title: 'HTML Fundamentals',
            slug: 'html-fundamentals',
            description: 'Learn HTML tags, elements, and structure.',
            courseId: course.id,
            lessonOrder: 3,
            videoDuration: 1200,
        },
    ]

    for (const lesson of lessons) {
        await prisma.lesson.create({
            data: lesson,
        })
    }
    console.log('✅ Sample lessons created')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Test Accounts:')
    console.log('-------------------')
    console.log('Admin:')
    console.log('  Email: admin@elearning.com')
    console.log('  Password: Admin@123')
    console.log('\nInstructor:')
    console.log('  Email: instructor@elearning.com')
    console.log('  Password: Instructor@123')
    console.log('\nStudent:')
    console.log('  Email: student@elearning.com')
    console.log('  Password: Student@123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
