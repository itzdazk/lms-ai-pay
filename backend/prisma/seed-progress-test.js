// prisma/seed-progress-test.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding test data for Progress API...')

    // === 1. Tạo User (Student & Instructor) ===
    const studentPassword = await bcrypt.hash('Password!123', 10)
    const instructorPassword = await bcrypt.hash('Password!123', 10)

    const student = await prisma.user.upsert({
        where: { email: 'studentSeed1@example.com' },
        update: {},
        create: {
            userName: 'student_seed1',
            email: 'studentseed1@example.com',
            passwordHash: studentPassword,
            fullName: 'Nguyễn Văn Học',
            role: 'STUDENT',
            emailVerified: true,
        },
    })

    const instructor = await prisma.user.upsert({
        where: { email: 'instructorSeed1@example.com' },
        update: {},
        create: {
            userName: 'instructor_seed1',
            email: 'instructorseed1@example.com',
            passwordHash: instructorPassword,
            fullName: 'Giảng viên A',
            role: 'INSTRUCTOR',
            emailVerified: true,
        },
    })

    // === 2. Tạo Category ===
    const category = await prisma.category.upsert({
        where: { slug: 'web-development3' },
        update: {},
        create: {
            name: 'Lập trình Web3',
            slug: 'web-development3',
            description:
                'Các khóa học về HTML, CSS, JavaScript, React, Node.js...',
            isActive: true,
        },
    })

    // === 3. Tạo Course ===
    const course = await prisma.course.upsert({
        where: { slug: 'react-js-tu-co-ban-den-nang-cao' },
        update: {},
        create: {
            title: 'React JS từ Cơ bản đến Nâng cao',
            slug: 'react-js-tu-co-ban-den-nang-cao',
            shortDescription: 'Học React từ A-Z với dự án thực tế',
            description:
                'Khóa học đầy đủ về React JS, bao gồm Hooks, Redux, Context API...',
            price: 599000,
            discountPrice: 399000,
            instructorId: instructor.id,
            categoryId: category.id,
            level: 'intermediate',
            durationHours: 20,
            totalLessons: 0, // sẽ được cập nhật sau khi tạo lesson
            language: 'vi',
            status: 'published',
            isFeatured: true,
            publishedAt: new Date(),
        },
    })

    // === 4. Tạo 5 Lessons ===
    const lessons = []
    const lessonTitles = [
        'Giới thiệu về React',
        'JSX và Components',
        'State và Props',
        'Hooks: useState, useEffect',
        'React Router & Dự án cuối khóa',
    ]

    for (let i = 0; i < lessonTitles.length; i++) {
        const lesson = await prisma.lesson.create({
            data: {
                courseId: course.id,
                title: lessonTitles[i],
                slug: `${course.slug}-lesson-${i + 1}`,
                description: `Nội dung chi tiết cho bài học: ${lessonTitles[i]}`,
                content: `<p>Đây là nội dung chi tiết của bài học <strong>${lessonTitles[i]}</strong>.</p>`,
                videoUrl: `/uploads/videos/lesson-${i + 1}.mp4`,
                videoDuration: 600 + i * 180, // 10-20 phút
                lessonOrder: i + 1,
                isPreview: i === 0, // bài đầu tiên là preview
                isPublished: true,
            },
        })
        lessons.push(lesson)
    }

    // Cập nhật totalLessons
    await prisma.course.update({
        where: { id: course.id },
        data: { totalLessons: lessons.length },
    })

    // === 5. Tạo Enrollment cho Student ===
    const enrollment = await prisma.enrollment.upsert({
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
            enrolledAt: new Date(),
            status: 'active',
        },
    })

    // === 6. Tạo Progress cho từng Lesson ===
    const progressData = [
        // Lesson 1: Đã hoàn thành
        {
            lessonId: lessons[0].id,
            isCompleted: true,
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
            watchDuration: 600,
            lastPosition: 600,
            attemptsCount: 1,
        },
        // Lesson 2: Đang xem dở (80%)
        {
            lessonId: lessons[1].id,
            isCompleted: false,
            completedAt: null,
            watchDuration: 720,
            lastPosition: 720,
            attemptsCount: 2,
        },
        // Lesson 3: Đã hoàn thành
        {
            lessonId: lessons[2].id,
            isCompleted: true,
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            watchDuration: 900,
            lastPosition: 900,
            attemptsCount: 1,
        },
        // Lesson 4: Chưa xem
        {
            lessonId: lessons[3].id,
            isCompleted: false,
            completedAt: null,
            watchDuration: 0,
            lastPosition: 0,
            attemptsCount: 0,
        },
        // Lesson 5: Chưa xem
        {
            lessonId: lessons[4].id,
            isCompleted: false,
            completedAt: null,
            watchDuration: 0,
            lastPosition: 0,
            attemptsCount: 0,
        },
    ]

    for (const data of progressData) {
        await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId: student.id,
                    lessonId: data.lessonId,
                },
            },
            update: {},
            create: {
                userId: student.id,
                lessonId: data.lessonId,
                courseId: course.id,
                isCompleted: data.isCompleted,
                completedAt: data.completedAt,
                watchDuration: data.watchDuration,
                lastPosition: data.lastPosition,
                attemptsCount: data.attemptsCount,
            },
        })
    }

    // === 7. Cập nhật progressPercentage cho Enrollment ===
    const completedCount = progressData.filter((p) => p.isCompleted).length
    const progressPercentage = Number(
        ((completedCount / lessons.length) * 100).toFixed(2)
    )

    await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
            progressPercentage,
            lastAccessedAt: new Date(),
            completedAt: completedCount === lessons.length ? new Date() : null,
        },
    })

    // === 8. Cập nhật completionRate cho Course ===
    const totalEnrollments = await prisma.enrollment.count({
        where: { courseId: course.id },
    })
    const completedEnrollments = await prisma.enrollment.count({
        where: {
            courseId: course.id,
            progressPercentage: 100,
        },
    })

    const completionRate =
        totalEnrollments > 0
            ? Number(
                  ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
              )
            : 0

    await prisma.course.update({
        where: { id: course.id },
        data: {
            completionRate,
            enrolledCount: { increment: 1 },
        },
    })

    console.log('Progress test data seeded successfully!')
    console.log(`
    Student: ${student.email} / password123
    Instructor: ${instructor.email} / password123
    Course: ${course.title}
    Lessons: ${lessons.length} created
    Progress: ${completedCount}/${lessons.length} completed
  `)
}

main()
    .catch((e) => {
        console.error('Error seeding data:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
