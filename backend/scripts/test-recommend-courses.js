// scripts/test-recommend-courses.js
// Script để test hàm recommendCoursesForUser

import knowledgeBaseService from '../src/services/knowledge-base.service.js'
import { prisma } from '../src/config/database.config.js'
import logger from '../src/config/logger.config.js'

async function testRecommendCoursesForUser() {
    console.log('🧪 Bắt đầu test hàm recommendCoursesForUser()...\n')

    try {
        // 1. Lấy một user từ database (hoặc tạo test user)
        const testUser = await prisma.user.findFirst({
            where: {
                role: 'STUDENT',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
            },
        })

        if (!testUser) {
            console.error('❌ Không tìm thấy user nào trong database!')
            console.log('💡 Hãy chạy: npm run prisma:seed để tạo dữ liệu test')
            process.exit(1)
        }

        console.log(`✅ Tìm thấy test user:`)
        console.log(`   - ID: ${testUser.id}`)
        console.log(`   - Email: ${testUser.email}`)
        console.log(`   - Tên: ${testUser.fullName}\n`)

        // 2. Kiểm tra số lượng courses trong database
        const totalCourses = await prisma.course.count({
            where: {
                status: 'PUBLISHED',
            },
        })
        console.log(`📚 Tổng số courses PUBLISHED trong database: ${totalCourses}\n`)

        if (totalCourses === 0) {
            console.warn('⚠️  Không có courses nào trong database!')
            console.log('💡 Hãy chạy: npm run prisma:seed để tạo dữ liệu test')
        }

        // 3. Kiểm tra enrolled courses của user
        const enrolledCourses = await prisma.enrollment.findMany({
            where: {
                userId: testUser.id,
                status: { in: ['ACTIVE', 'COMPLETED'] },
            },
            select: {
                courseId: true,
                course: {
                    select: {
                        title: true,
                    },
                },
            },
        })

        console.log(`📖 User đã enroll ${enrolledCourses.length} courses:`)
        enrolledCourses.forEach((enrollment, idx) => {
            console.log(`   ${idx + 1}. ${enrollment.course.title} (ID: ${enrollment.courseId})`)
        })
        console.log()

        // 4. Test 1: Gọi hàm không có conversation history
        console.log('🔍 Test 1: Gọi hàm không có conversation history')
        console.log('─'.repeat(60))
        const result1 = await knowledgeBaseService.recommendCoursesForUser(testUser.id, {})
        console.log(`✅ Kết quả: ${result1.length} courses được gợi ý\n`)

        if (result1.length > 0) {
            console.log('📋 Danh sách courses được gợi ý:')
            result1.forEach((course, idx) => {
                console.log(`\n   ${idx + 1}. ${course.title}`)
                console.log(`      - ID: ${course.id}`)
                console.log(`      - Level: ${course.level || 'N/A'}`)
                console.log(`      - Rating: ${course.ratingAvg ? course.ratingAvg.toFixed(1) : 'N/A'}/5.0`)
                console.log(`      - Enrolled: ${course.enrolledCount || 0} học viên`)
                console.log(`      - Featured: ${course.isFeatured ? 'Có' : 'Không'}`)
                if (course.shortDescription) {
                    const desc = course.shortDescription.length > 100
                        ? course.shortDescription.substring(0, 100) + '...'
                        : course.shortDescription
                    console.log(`      - Mô tả: ${desc}`)
                }
            })
        } else {
            console.warn('⚠️  Không có courses nào được gợi ý!')
        }
        console.log('\n')

        // 5. Test 2: Gọi hàm với conversation history giả
        console.log('🔍 Test 2: Gọi hàm với conversation history (keywords: react, javascript)')
        console.log('─'.repeat(60))
        const mockHistory = [
            {
                senderType: 'user',
                message: 'Tôi muốn học React và JavaScript, level cơ bản',
            },
            {
                senderType: 'ai',
                message: 'Tôi có thể giúp bạn tìm khóa học phù hợp',
            },
        ]

        const result2 = await knowledgeBaseService.recommendCoursesForUser(testUser.id, {
            conversationHistory: mockHistory,
        })
        console.log(`✅ Kết quả: ${result2.length} courses được gợi ý\n`)

        if (result2.length > 0) {
            console.log('📋 Danh sách courses được gợi ý (với preferences):')
            result2.forEach((course, idx) => {
                console.log(`\n   ${idx + 1}. ${course.title}`)
                console.log(`      - ID: ${course.id}`)
                console.log(`      - Level: ${course.level || 'N/A'}`)
                console.log(`      - Rating: ${course.ratingAvg ? course.ratingAvg.toFixed(1) : 'N/A'}/5.0`)
            })
        }
        console.log('\n')

        // 6. Test 3: Kiểm tra courses được gợi ý không trùng với enrolled courses
        console.log('🔍 Test 3: Kiểm tra courses được gợi ý không trùng với enrolled courses')
        console.log('─'.repeat(60))
        const enrolledCourseIds = enrolledCourses.map(e => e.courseId)
        const recommendedCourseIds = result1.map(c => c.id)
        const overlap = recommendedCourseIds.filter(id => enrolledCourseIds.includes(id))

        if (overlap.length > 0) {
            console.warn(`⚠️  Có ${overlap.length} courses trùng với enrolled courses:`)
            overlap.forEach(id => {
                const course = result1.find(c => c.id === id)
                console.warn(`   - ${course?.title} (ID: ${id})`)
            })
        } else {
            console.log('✅ Không có courses nào trùng với enrolled courses (đúng như mong đợi)')
        }
        console.log('\n')

        // 7. Test 4: Kiểm tra courses có phải từ database thật không
        console.log('🔍 Test 4: Kiểm tra courses có phải từ database thật không')
        console.log('─'.repeat(60))
        if (result1.length > 0) {
            const firstCourseId = result1[0].id
            const dbCourse = await prisma.course.findUnique({
                where: { id: firstCourseId },
                select: {
                    id: true,
                    title: true,
                    status: true,
                },
            })

            if (dbCourse) {
                console.log(`✅ Course đầu tiên có trong database:`)
                console.log(`   - ID: ${dbCourse.id}`)
                console.log(`   - Title: ${dbCourse.title}`)
                console.log(`   - Status: ${dbCourse.status}`)
            } else {
                console.error(`❌ Course ID ${firstCourseId} KHÔNG có trong database!`)
            }
        }
        console.log('\n')

        // 8. Tổng kết
        console.log('📊 TỔNG KẾT:')
        console.log('─'.repeat(60))
        console.log(`✅ Test user: ${testUser.email}`)
        console.log(`✅ Tổng courses trong DB: ${totalCourses}`)
        console.log(`✅ Courses đã enroll: ${enrolledCourses.length}`)
        console.log(`✅ Courses được gợi ý (test 1): ${result1.length}`)
        console.log(`✅ Courses được gợi ý (test 2): ${result2.length}`)
        console.log(`✅ Courses trùng với enrolled: ${overlap.length}`)
        console.log('\n✅ Test hoàn thành!\n')

    } catch (error) {
        console.error('❌ Lỗi khi test:', error)
        console.error(error.stack)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Chạy test
testRecommendCoursesForUser()

