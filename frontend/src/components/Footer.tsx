import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    BookOpen,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Mail,
    Phone,
    Linkedin,
} from 'lucide-react'
import { CONTACT_INFO } from '../lib/constants'
import { getPublicSystemConfig } from '../lib/api/system-config'
import { categoriesApi } from '../lib/api/categories'
import type { Category } from '../lib/api/types'

export function Footer() {
    const [footerConfig, setFooterConfig] = useState<any>(null)
    const [contactInfo, setContactInfo] = useState(CONTACT_INFO)
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const publicConfig = await getPublicSystemConfig()
                if (publicConfig.footer) {
                    setFooterConfig(publicConfig.footer)
                }
                if (publicConfig.contact) {
                    setContactInfo(publicConfig.contact as any)
                }
            } catch (error) {
                console.error('Failed to load footer config:', error)
            }
        }
        loadConfig()
    }, [])

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await categoriesApi.getCategories({
                    isActive: true,
                    limit: 10,
                })
                // Chỉ lấy parent categories (không có parentId)
                const parentCategories = response.data.filter(
                    (cat) => !cat.parentId
                )
                setCategories(parentCategories)
            } catch (error) {
                console.error('Failed to load categories:', error)
                setCategories([])
            }
        }
        loadCategories()
    }, [])

    const brandName = footerConfig?.brandName || 'EduLearn'
    const description = footerConfig?.description || 'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp.'
    const socialMedia = footerConfig?.socialMedia || {}
    const copyright = footerConfig?.copyright || '© 2025 EduLearn. All rights reserved.'
    const quickLinks = footerConfig?.quickLinks || [
        { label: 'Khóa học', url: '/courses' },
        { label: 'Về chúng tôi', url: '/about' },
    ]

    return (
        <footer className='border-t border-[#2D2D2D] bg-black'>
            <div className='container mx-auto px-4 py-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {/* Brand */}
                    <div>
                        <Link to='/' className='flex items-center gap-2 mb-3'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-white/30'>
                                <BookOpen className='h-5 w-5 text-white' />
                            </div>
                            <span className='text-lg font-semibold text-white'>
                                {brandName}
                            </span>
                        </Link>
                        <p className='text-sm text-gray-400 mb-3'>
                            {description}
                        </p>
                        <div className='flex gap-3'>
                            {socialMedia.facebook && (
                                <a
                                    href={socialMedia.facebook}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-gray-400 hover:text-blue-600 transition-colors'
                                >
                                    <Facebook className='h-5 w-5' />
                                </a>
                            )}
                            {socialMedia.twitter && (
                                <a
                                    href={socialMedia.twitter}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-gray-400 hover:text-blue-600 transition-colors'
                                >
                                    <Twitter className='h-5 w-5' />
                                </a>
                            )}
                            {socialMedia.instagram && (
                                <a
                                    href={socialMedia.instagram}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-gray-400 hover:text-blue-600 transition-colors'
                                >
                                    <Instagram className='h-5 w-5' />
                                </a>
                            )}
                            {socialMedia.youtube && (
                                <a
                                    href={socialMedia.youtube}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-gray-400 hover:text-blue-600 transition-colors'
                                >
                                    <Youtube className='h-5 w-5' />
                                </a>
                            )}
                            {socialMedia.linkedin && (
                                <a
                                    href={socialMedia.linkedin}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-gray-400 hover:text-blue-600 transition-colors'
                                >
                                    <Linkedin className='h-5 w-5' />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    {quickLinks.length > 0 && (
                        <div>
                            <h3 className='font-semibold mb-3 text-white text-sm'>
                                Liên kết nhanh
                            </h3>
                            <ul className='space-y-1.5 text-sm'>
                                {quickLinks.map((link: any, index: number) => (
                                    <li key={index}>
                                        <Link
                                            to={link.url}
                                            className='text-gray-400 hover:text-blue-600 transition-colors'
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Categories - Lấy từ API thực sự */}
                    {categories.length > 0 && (
                        <div>
                            <h3 className='font-semibold mb-3 text-white text-sm'>
                                Danh mục
                            </h3>
                            <ul className='space-y-1.5 text-sm'>
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            to={`/categories/${category.id}`}
                                            className='text-gray-400 hover:text-blue-600 transition-colors'
                                        >
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Contact */}
                    <div>
                        <h3 className='font-semibold mb-3 text-white text-sm'>
                            Liên hệ
                        </h3>
                        <ul className='space-y-2 text-sm text-gray-400'>
                            <li className='flex items-start gap-2'>
                                <Phone className='h-4 w-4 mt-0.5 flex-shrink-0' />
                                <a
                                    href={`tel:${contactInfo.hotline}`}
                                    className='hover:text-blue-500 transition-colors'
                                >
                                    {contactInfo.hotlineDisplay}
                                </a>
                            </li>
                            <li className='flex items-start gap-2'>
                                <Mail className='h-4 w-4 mt-0.5 flex-shrink-0' />
                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    className='hover:text-blue-500 transition-colors'
                                >
                                    {contactInfo.email}
                                </a>
                            </li>
                            <li className='text-xs text-gray-500 mt-2'>
                                Giờ làm việc: {contactInfo.workingHours}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className='border-t border-[#2D2D2D] mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400'>
                    <p>{copyright}</p>
                    <div className='flex gap-6'>
                        <Link
                            to='/terms'
                            className='hover:text-blue-600 transition-colors'
                        >
                            Điều khoản sử dụng
                        </Link>
                        <Link
                            to='/privacy'
                            className='hover:text-blue-600 transition-colors'
                        >
                            Chính sách bảo mật
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
