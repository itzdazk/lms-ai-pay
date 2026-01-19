// frontend/src/components/admin/system-config/FooterSection.tsx
import { Plus, X } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import type { SystemSettings } from '../../../lib/api/system-config'

interface FooterSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
    onUpdateArray: (path: string[], index: number, value: any) => void
    onAddArrayItem: (path: string[], defaultItem: any) => void
    onRemoveArrayItem: (path: string[], index: number) => void
}

export function FooterSection({
    formData,
    onUpdate,
    onUpdateArray,
    onAddArrayItem,
    onRemoveArrayItem,
}: FooterSectionProps) {
    return (
        <div className='space-y-6'>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thông tin cơ bản</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Cấu hình nội dung footer
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Mô tả
                        </label>
                        <textarea
                            className='w-full min-h-[80px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={formData.footer?.description || ''}
                            onChange={(e) => onUpdate(['footer', 'description'], e.target.value)}
                            placeholder='Mô tả ngắn về công ty...'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Copyright
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.footer?.copyright || ''}
                            onChange={(e) => onUpdate(['footer', 'copyright'], e.target.value)}
                            placeholder='© 2025 EduLearn. All rights reserved.'
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Social Media</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Liên kết mạng xã hội
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Facebook URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.footer?.socialMedia?.facebook || ''}
                            onChange={(e) =>
                                onUpdate(['footer', 'socialMedia', 'facebook'], e.target.value)
                            }
                            placeholder='https://facebook.com/edulearn'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Twitter URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.footer?.socialMedia?.twitter || ''}
                            onChange={(e) =>
                                onUpdate(['footer', 'socialMedia', 'twitter'], e.target.value)
                            }
                            placeholder='https://twitter.com/edulearn'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Instagram URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.footer?.socialMedia?.instagram || ''}
                            onChange={(e) =>
                                onUpdate(['footer', 'socialMedia', 'instagram'], e.target.value)
                            }
                            placeholder='https://instagram.com/edulearn'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            YouTube URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.footer?.socialMedia?.youtube || ''}
                            onChange={(e) =>
                                onUpdate(['footer', 'socialMedia', 'youtube'], e.target.value)
                            }
                            placeholder='https://youtube.com/@edulearn'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            LinkedIn URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.footer?.socialMedia?.linkedin || ''}
                            onChange={(e) =>
                                onUpdate(['footer', 'socialMedia', 'linkedin'], e.target.value)
                            }
                            placeholder='https://linkedin.com/company/edulearn'
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>Quick Links</CardTitle>
                            <CardDescription className='text-gray-400'>
                                Các liên kết nhanh trong footer
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            size='sm'
                            onClick={() =>
                                onAddArrayItem(['footer', 'quickLinks'], { label: '', url: '' })
                            }
                            className='bg-blue-600 hover:bg-blue-700'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {(formData.footer?.quickLinks || []).map((link, index) => (
                        <div
                            key={index}
                            className='p-4 border border-[#2D2D2D] rounded-lg space-y-3'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-300'>
                                    Link #{index + 1}
                                </span>
                                <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => onRemoveArrayItem(['footer', 'quickLinks'], index)}
                                    className='text-red-400 hover:text-red-300'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        Label
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={link.label || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['footer', 'quickLinks'], index, {
                                                label: e.target.value,
                                            })
                                        }
                                        placeholder='Khóa học'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        URL
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={link.url || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['footer', 'quickLinks'], index, {
                                                url: e.target.value,
                                            })
                                        }
                                        placeholder='/courses'
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
