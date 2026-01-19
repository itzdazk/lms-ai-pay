// backend/prisma/seed-system-config.js
// Script để seed system settings từ constants.ts hiện tại
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultSettings = {
    system: {
        name: 'LMS AI Pay',
        logo: null,
        email: 'admin@lmsaipay.com',
    },
    registration: {
        enabled: true,
    },
    contact: {
        hotline: '1900123456',
        hotlineDisplay: '1900 123 456',
        email: 'support@edulearn.vn',
        zalo: 'https://zalo.me/0123456789',
        facebook: 'https://facebook.com/edulearn',
        workingHours: '8:00 - 22:00 (T2-CN)',
    },
    legal: {
        termsOfService: null,
        privacyPolicy: null,
        refundPolicy: null,
    },
    landing: {
        heroTitle: 'Học tập thông minh với AI',
        heroDescription:
            'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp với hơn 1000+ khóa học chất lượng cao.',
        heroBackgroundImage:
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
        categoriesTitle: 'Khám phá theo danh mục',
        categoriesDescription:
            'Tìm khóa học phù hợp với sở thích và mục tiêu của bạn',
    },
    about: {
        heroTitle: 'Nền tảng học tập thế hệ mới',
        heroDescription:
            'EduLearn là nền tảng học tập trực tuyến tích hợp AI, giúp hàng triệu người học viên phát triển kỹ năng và đạt được mục tiêu nghề nghiệp.',
        heroBackgroundImage:
            'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80',
        stats: {
            courses: '1,000+',
            students: '50,000+',
            instructors: '200+',
            certificates: '25,000+',
        },
        story: {
            title: 'Câu chuyện của chúng tôi',
            paragraph1:
                'EduLearn được thành lập vào năm 2020 với mục tiêu làm cho giáo dục chất lượng cao trở nên dễ tiếp cận hơn cho mọi người. Chúng tôi tin rằng mọi người đều có quyền học hỏi và phát triển, bất kể họ ở đâu hay hoàn cảnh ra sao.',
            paragraph2:
                'Với sự kết hợp giữa công nghệ AI tiên tiến và nội dung chất lượng cao từ các chuyên gia hàng đầu, chúng tôi đã giúp hàng chục nghìn học viên đạt được mục tiêu nghề nghiệp của họ.',
        },
        values: [
            {
                title: 'Sứ mệnh',
                description:
                    'Làm cho giáo dục chất lượng cao trở nên dễ tiếp cận cho mọi người, mọi nơi thông qua công nghệ AI.',
            },
            {
                title: 'Tầm nhìn',
                description:
                    'Trở thành nền tảng học tập trực tuyến hàng đầu tại Việt Nam, nơi mọi người có thể phát triển kỹ năng và sự nghiệp.',
            },
            {
                title: 'Đổi mới',
                description:
                    'Không ngừng cải tiến và áp dụng công nghệ mới như AI để nâng cao trải nghiệm học tập.',
            },
            {
                title: 'Chất lượng',
                description:
                    'Cam kết cung cấp nội dung chất lượng cao được xây dựng bởi các chuyên gia hàng đầu trong ngành.',
            },
        ],
        team: [
            {
                name: 'Nguyễn Văn A',
                role: 'CEO & Founder',
                avatar:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=ceo',
                bio: 'Chuyên gia công nghệ với hơn 15 năm kinh nghiệm',
            },
            {
                name: 'Trần Thị B',
                role: 'CTO',
                avatar:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=cto',
                bio: 'Expert về AI và Machine Learning',
            },
            {
                name: 'Lê Văn C',
                role: 'Head of Education',
                avatar:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=head',
                bio: 'Chuyên gia giáo dục với đam mê công nghệ',
            },
            {
                name: 'Phạm Thị D',
                role: 'Head of Product',
                avatar:
                    'https://api.dicebear.com/7.x/avataaars/svg?seed=product',
                bio: 'Designer với tư duy sáng tạo và user-centric',
            },
        ],
        timeline: [
            {
                year: '2020',
                title: 'Thành lập',
                description:
                    'EduLearn được thành lập với 10 khóa học đầu tiên',
            },
            {
                year: '2021',
                title: 'Mở rộng',
                description:
                    'Đạt 10,000 học viên và 100 khóa học',
            },
            {
                year: '2022',
                title: 'Tích hợp AI',
                description:
                    'Ra mắt Gia sư AI - trợ lý học tập thông minh',
            },
            {
                year: '2023',
                title: 'Tăng trưởng',
                description:
                    'Vượt 50,000 học viên và 1,000 khóa học',
            },
            {
                year: '2024',
                title: 'Đổi mới',
                description:
                    'Ra mắt Voice Search và Smart Recommendations',
            },
            {
                year: '2025',
                title: 'Mở rộng toàn cầu',
                description:
                    'Hợp tác với 50+ đối tác quốc tế và ra mắt chương trình chứng chỉ toàn cầu',
            },
        ],
    },
    footer: {
        brandName: 'EduLearn',
        description:
            'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp.',
        socialMedia: {
            facebook: 'https://facebook.com/edulearn',
            twitter: 'https://twitter.com/edulearn',
            instagram: 'https://instagram.com/edulearn',
            youtube: 'https://youtube.com/@edulearn',
            linkedin: null,
        },
        copyright: '© 2025 EduLearn. All rights reserved.',
        quickLinks: [
            { label: 'Khóa học', url: '/courses' },
            { label: 'Về chúng tôi', url: '/about' },
        ],
        footerCategories: [
            {
                label: 'Web Development',
                url: '/courses?category=web-development',
            },
            {
                label: 'Mobile Development',
                url: '/courses?category=mobile-development',
            },
        ],
    },
    seo: {
        siteName: 'EduLearn',
        pageTitle: 'LMS AI Pay - Hệ thống quản lý học tập trực tuyến',
        defaultTitle: 'EduLearn - Nền tảng học tập trực tuyến',
        defaultDescription:
            'Học tập thông minh với AI. Hơn 1000+ khóa học chất lượng cao từ các chuyên gia hàng đầu.',
        defaultKeywords:
            'học trực tuyến, elearning, AI, giáo dục, khóa học online',
        ogImage: null,
        favicon: '/favicon.ico',
    },
}

async function seedSystemConfig() {
    try {
        console.log('🌱 Seeding system settings...')

        // Check if settings already exist
        const existing = await prisma.systemSetting.findFirst()

        if (existing) {
            console.log('✅ System settings already exist, skipping seed')
            return
        }

        // Create default settings
        await prisma.systemSetting.create({
            data: {
                settings: defaultSettings,
            },
        })

        console.log('✅ System settings seeded successfully!')
    } catch (error) {
        console.error('❌ Error seeding system settings:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedSystemConfig()
        .then(() => {
            console.log('Seed completed')
            process.exit(0)
        })
        .catch((error) => {
            console.error('Seed failed:', error)
            process.exit(1)
        })
}

export default seedSystemConfig
