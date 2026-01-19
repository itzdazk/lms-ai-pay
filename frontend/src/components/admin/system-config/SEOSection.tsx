// frontend/src/components/admin/system-config/SEOSection.tsx
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
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
                        Title mặc định
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.defaultTitle || ''}
                        onChange={(e) => onUpdate(['seo', 'defaultTitle'], e.target.value)}
                        placeholder='EduLearn - Nền tảng học tập trực tuyến'
                    />
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
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        OG Image (URL)
                    </label>
                    <DarkOutlineInput
                        type='url'
                        value={formData.seo?.ogImage || ''}
                        onChange={(e) => onUpdate(['seo', 'ogImage'], e.target.value)}
                        placeholder='https://example.com/og-image.jpg'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Favicon (URL)
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.seo?.favicon || ''}
                        onChange={(e) => onUpdate(['seo', 'favicon'], e.target.value)}
                        placeholder='/favicon.ico'
                    />
                </div>
            </CardContent>
        </Card>
    )
}
