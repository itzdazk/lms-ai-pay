// frontend/src/components/admin/system-config/SEOSection.tsx
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { ImageUploadInput } from './ImageUploadInput'
import type { SystemSettings } from '../../../lib/api/system-config'

interface SEOSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
}

export function SEOSection({ formData, onUpdate }: SEOSectionProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>SEO & Meta Information</CardTitle>
                <CardDescription className='text-gray-400'>
                    Cấu hình thông tin SEO và meta tags
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Tên site
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.siteName || ''}
                        onChange={(e) => onUpdate(['seo', 'siteName'], e.target.value)}
                        placeholder='EduLearn'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Tiêu đề trang web (Page Title)
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.pageTitle || ''}
                        onChange={(e) => onUpdate(['seo', 'pageTitle'], e.target.value)}
                        placeholder='LMS AI Pay - Hệ thống quản lý học tập trực tuyến'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Tiêu đề hiển thị trên tab trình duyệt (thẻ &lt;title&gt;)
                    </p>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Title mặc định (SEO)
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.defaultTitle || ''}
                        onChange={(e) => onUpdate(['seo', 'defaultTitle'], e.target.value)}
                        placeholder='EduLearn - Nền tảng học tập trực tuyến'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Title mặc định cho các trang (dùng cho SEO meta tags)
                    </p>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Description mặc định
                    </label>
                    <textarea
                        className='w-full min-h-[100px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.seo?.defaultDescription || ''}
                        onChange={(e) =>
                            onUpdate(['seo', 'defaultDescription'], e.target.value)
                        }
                        placeholder='Mô tả ngắn về nền tảng...'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Keywords
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.defaultKeywords || ''}
                        onChange={(e) => onUpdate(['seo', 'defaultKeywords'], e.target.value)}
                        placeholder='học trực tuyến, elearning, AI, giáo dục'
                    />
                </div>
                <div>
                    <ImageUploadInput
                        label='OG Image (URL)'
                        value={formData.seo?.ogImage || null}
                        onChange={(url) => onUpdate(['seo', 'ogImage'], url)}
                        placeholder='https://example.com/og-image.jpg'
                        uploadType='system'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Ảnh hiển thị khi chia sẻ link lên mạng xã hội (Facebook, LinkedIn, Twitter)
                    </p>
                </div>
                <div>
                    <ImageUploadInput
                        label='Favicon (URL)'
                        value={formData.seo?.favicon || null}
                        onChange={(url) => onUpdate(['seo', 'favicon'], url)}
                        placeholder='/favicon.ico'
                        uploadType='system'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Icon hiển thị trên tab trình duyệt (khuyến nghị: 32x32px hoặc 16x16px)
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
