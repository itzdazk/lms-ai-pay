// backend/src/services/system-config.service.js
import { prisma } from '../config/database.config.js'
import logger from '../config/logger.config.js'

class SystemConfigService {
    /**
     * Get default settings structure
     * @returns {object} Default settings object
     */
    getDefaultSettings() {
        return {
            system: {
                name: 'EduLearn',
                logo: 'https://cdn.vectorstock.com/i/500p/40/30/grunge-white-letter-e-logo-vector-27974030.jpg',
                email: 'support@edulearn.vn',
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
                    'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp với hơn 10+ khóa học chất lượng cao.',
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
                    courses: '10+',
                    students: '100+',
                    instructors: '5+',
                    certificates: '10+',
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
                description:
                    'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp.',
                socialMedia: {
                    facebook: 'https://facebook.com/edulearn',
                    twitter: 'https://twitter.com/edulearn',
                    instagram: 'https://instagram.com/edulearn',
                    youtube: 'https://youtube.com/@edulearn',
                    linkedin: 'https://linkedin.com/company/edulearn',
                },
                copyright: '© 2026 EduLearn. All rights reserved.',
                quickLinks: [
                    { label: 'Khóa học', url: '/courses' },
                    { label: 'Về chúng tôi', url: '/about' },
                ],
            },
            seo: {
                siteName: 'EduLearn',
                pageTitle: 'EduLearn - Nền tảng học tập trực tuyến',
                defaultTitle: 'EduLearn - Nền tảng học tập trực tuyến',
                defaultDescription:
                    'Học tập thông minh với AI. Hơn 1000+ khóa học chất lượng cao từ các chuyên gia hàng đầu.',
                defaultKeywords:
                    'học trực tuyến, elearning, AI, giáo dục, khóa học online',
                ogImage: 'https://cdn.vectorstock.com/i/500p/40/30/grunge-white-letter-e-logo-vector-27974030.jpg',
                favicon: 'https://cdn.vectorstock.com/i/500p/40/30/grunge-white-letter-e-logo-vector-27974030.jpg',
            },
        }
    }

    /**
     * Get system settings (singleton - only 1 record)
     * @returns {Promise<object>} Settings object
     */
    async getSettings() {
        try {
            const config = await prisma.systemSetting.findFirst()

            if (!config || !config.settings) {
                // Return default if no config exists
                return this.getDefaultSettings()
            }

            // Merge with defaults to ensure all fields exist
            const defaults = this.getDefaultSettings()
            const settings = config.settings || {}
            
            logger.info('📥 getSettings - DB settings.landing:', {
                landing: settings.landing,
                heroTitle: settings.landing?.heroTitle,
            })
            
            const mergedLanding = {
                ...defaults.landing,
                ...(settings.landing || {}),
            }
            
            logger.info('📥 getSettings - Merged landing:', {
                landing: mergedLanding,
                heroTitle: mergedLanding.heroTitle,
            })
            
            return {
                system: { ...defaults.system, ...(settings.system || {}) },
                registration: {
                    ...defaults.registration,
                    ...(settings.registration || {}),
                },
                contact: { ...defaults.contact, ...(settings.contact || {}) },
                legal: { ...defaults.legal, ...(settings.legal || {}) },
                landing: mergedLanding,
                about: {
                    ...defaults.about,
                    stats: {
                        ...defaults.about.stats,
                        ...(settings.about?.stats || {}),
                    },
                    story: {
                        ...defaults.about.story,
                        ...(settings.about?.story || {}),
                    },
                    values: settings.about?.values || defaults.about.values,
                    team: settings.about?.team || defaults.about.team,
                    timeline:
                        settings.about?.timeline || defaults.about.timeline,
                    heroTitle:
                        settings.about?.heroTitle || defaults.about.heroTitle,
                    heroDescription:
                        settings.about?.heroDescription ||
                        defaults.about.heroDescription,
                    heroBackgroundImage:
                        settings.about?.heroBackgroundImage ||
                        defaults.about.heroBackgroundImage,
                },
                footer: {
                    ...defaults.footer,
                    socialMedia: {
                        ...defaults.footer.socialMedia,
                        ...(settings.footer?.socialMedia || {}),
                    },
                    quickLinks:
                        settings.footer?.quickLinks ||
                        defaults.footer.quickLinks,
                    description:
                        settings.footer?.description ||
                        defaults.footer.description,
                    copyright:
                        settings.footer?.copyright ||
                        defaults.footer.copyright,
                },
                seo: { ...defaults.seo, ...(settings.seo || {}) },
            }
        } catch (error) {
            logger.error('Error getting system settings:', error)
            // Return defaults on error
            return this.getDefaultSettings()
        }
    }

    /**
     * Update system settings (upsert - singleton pattern)
     * @param {object} updates - Partial settings to update
     * @param {number} userId - Admin user ID who updated
     * @returns {Promise<object>} Updated settings
     */
    async updateSettings(updates, userId) {
        try {
            logger.info('📥 Received update request:', {
                userId,
                updatesKeys: Object.keys(updates || {}),
            })

            // Get current settings
            const current = await this.getSettings()

            // Deep merge updates with current settings
            // Helper function for deep merge
            const deepMerge = (target, source) => {
                if (!source || typeof source !== 'object') return target
                const result = { ...target }
                for (const key in source) {
                    // Allow null values to be set (for clearing fields)
                    if (source[key] === undefined) {
                        // Skip undefined values, keep current
                        continue
                    }
                    if (
                        Array.isArray(source[key]) ||
                        (typeof source[key] === 'object' &&
                            !Array.isArray(source[key]) &&
                            source[key] !== null &&
                            source[key].constructor === Object)
                    ) {
                        // For arrays, replace entirely if provided
                        if (Array.isArray(source[key])) {
                            result[key] = source[key]
                        } else {
                            // For objects, deep merge
                            result[key] = deepMerge(
                                target[key] || {},
                                source[key]
                            )
                        }
                    } else {
                        // For primitives or null, set directly
                        result[key] = source[key]
                    }
                }
                return result
            }

            const merged = {
                system: deepMerge(current.system || {}, updates.system || {}),
                registration: deepMerge(
                    current.registration || {},
                    updates.registration || {}
                ),
                contact: deepMerge(current.contact || {}, updates.contact || {}),
                legal: deepMerge(current.legal || {}, updates.legal || {}),
                landing: deepMerge(current.landing || {}, updates.landing || {}),
                about: deepMerge(current.about || {}, updates.about || {}),
                footer: deepMerge(current.footer || {}, updates.footer || {}),
                seo: deepMerge(current.seo || {}, updates.seo || {}),
            }

            // Handle arrays explicitly (replace if provided, keep current if not)
            if (updates.about?.values !== undefined) {
                merged.about.values = updates.about.values
            } else if (!merged.about.values) {
                merged.about.values = current.about?.values || []
            }

            if (updates.about?.team !== undefined) {
                merged.about.team = updates.about.team
            } else if (!merged.about.team) {
                merged.about.team = current.about?.team || []
            }

            if (updates.about?.timeline !== undefined) {
                merged.about.timeline = updates.about.timeline
            } else if (!merged.about.timeline) {
                merged.about.timeline = current.about?.timeline || []
            }

            if (updates.footer?.quickLinks !== undefined) {
                merged.footer.quickLinks = updates.footer.quickLinks
            } else if (!merged.footer.quickLinks) {
                merged.footer.quickLinks = current.footer?.quickLinks || []
            }


            // Add metadata
            if (userId) {
                merged.metadata = {
                    updatedBy: userId,
                    lastUpdated: new Date().toISOString(),
                }
            }

            // Upsert (create or update) - singleton pattern
            logger.info('💾 Saving merged settings to database...')
            const config = await prisma.systemSetting.upsert({
                where: { id: 1 },
                create: {
                    settings: merged,
                },
                update: {
                    settings: merged,
                    updatedAt: new Date(),
                },
            })

            logger.info(`✅ System settings updated by user ${userId}`)

            return config.settings
        } catch (error) {
            logger.error('Error updating system settings:', error)
            throw error
        }
    }

    /**
     * Get public settings (only contact and basic system info)
     * @param {object} settings - Full settings object (optional, will fetch if not provided)
     * @returns {Promise<object>} Public settings
     */
    async getPublicSettings(settings = null) {
        const fullSettings = settings || (await this.getSettings())

        logger.info('📤 getPublicSettings - fullSettings.landing:', {
            landing: fullSettings.landing,
            heroTitle: fullSettings.landing?.heroTitle,
        })

        const publicSettings = {
            system: {
                name: fullSettings.system?.name,
                logo: fullSettings.system?.logo,
            },
            contact: fullSettings.contact || {},
            landing: fullSettings.landing || {},
            about: {
                heroTitle: fullSettings.about?.heroTitle,
                heroDescription: fullSettings.about?.heroDescription,
                heroBackgroundImage: fullSettings.about?.heroBackgroundImage,
                stats: fullSettings.about?.stats,
                story: fullSettings.about?.story,
                values: fullSettings.about?.values,
                team: fullSettings.about?.team,
                timeline: fullSettings.about?.timeline,
            },
            footer: fullSettings.footer || {},
            seo: fullSettings.seo || {},
            legal: fullSettings.legal || {},
        }

        logger.info('📤 getPublicSettings - returning landing:', {
            landing: publicSettings.landing,
            heroTitle: publicSettings.landing?.heroTitle,
        })

        return publicSettings
    }

    /**
     * Check if user registration is enabled
     * @returns {Promise<boolean>}
     */
    async isRegistrationEnabled() {
        const settings = await this.getSettings()
        return settings.registration?.enabled ?? true
    }
}

export default new SystemConfigService()
