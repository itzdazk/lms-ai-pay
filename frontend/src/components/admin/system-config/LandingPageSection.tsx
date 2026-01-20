// frontend/src/components/admin/system-config/LandingPageSection.tsx
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

interface LandingPageSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
}

export function LandingPageSection({
    formData,
    onUpdate,
}: LandingPageSectionProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>Trang chủ (Landing Page)</CardTitle>
                <CardDescription className='text-gray-400'>
                    Cấu hình nội dung trang chủ
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Tiêu đề Hero
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.landing?.heroTitle || ''}
                        onChange={(e) => onUpdate(['landing', 'heroTitle'], e.target.value)}
                        placeholder='Học tập thông minh với AI'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Mô tả Hero
                    </label>
                    <textarea
                        className='w-full min-h-[100px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.landing?.heroDescription || ''}
                        onChange={(e) =>
                            onUpdate(['landing', 'heroDescription'], e.target.value)
                        }
                        placeholder='Mô tả ngắn gọn về nền tảng...'
                    />
                </div>
                <ImageUploadInput
                    label='Background Image'
                    value={formData.landing?.heroBackgroundImage || null}
                    onChange={(url) => onUpdate(['landing', 'heroBackgroundImage'], url)}
                    placeholder='Nhập URL hoặc tải ảnh lên'
                    uploadType='system'
                />
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Tiêu đề Section Danh mục
                    </label>
                    <DarkOutlineInput
                        type='text'
                        value={formData.landing?.categoriesTitle || ''}
                        onChange={(e) =>
                            onUpdate(['landing', 'categoriesTitle'], e.target.value)
                        }
                        placeholder='Khám phá theo danh mục'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Mô tả Section Danh mục
                    </label>
                    <textarea
                        className='w-full min-h-[80px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.landing?.categoriesDescription || ''}
                        onChange={(e) =>
                            onUpdate(['landing', 'categoriesDescription'], e.target.value)
                        }
                        placeholder='Mô tả về section danh mục...'
                    />
                </div>
            </CardContent>
        </Card>
    )
}
