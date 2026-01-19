// frontend/src/components/admin/system-config/SystemInfoSection.tsx
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

interface SystemInfoSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
}

export function SystemInfoSection({
    formData,
    onUpdate,
}: SystemInfoSectionProps) {
    return (
        <div className='space-y-6'>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thông tin hệ thống</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Cấu hình thông tin cơ bản của hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Tên hệ thống
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.system?.name || ''}
                            onChange={(e) => onUpdate(['system', 'name'], e.target.value)}
                            placeholder='Nhập tên hệ thống'
                        />
                    </div>
                    <ImageUploadInput
                        label='Logo'
                        value={formData.system?.logo || null}
                        onChange={(url) => onUpdate(['system', 'logo'], url)}
                        placeholder='Nhập URL logo hoặc tải ảnh lên'
                        uploadType='system'
                    />
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Email hệ thống
                        </label>
                        <DarkOutlineInput
                            type='email'
                            value={formData.system?.email || ''}
                            onChange={(e) => onUpdate(['system', 'email'], e.target.value)}
                            placeholder='admin@example.com'
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Đăng ký người dùng</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Bật/tắt chức năng đăng ký người dùng mới
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-gray-300'>
                                Cho phép đăng ký người dùng mới
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>
                                Khi tắt, chỉ admin mới có thể tạo tài khoản mới
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const current = formData.registration?.enabled ?? true
                                onUpdate(['registration', 'enabled'], !current)
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.registration?.enabled
                                    ? 'bg-blue-600'
                                    : 'bg-gray-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.registration?.enabled
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thông tin liên hệ</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Cấu hình các kênh liên hệ với người dùng
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Hotline
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.contact?.hotline || ''}
                            onChange={(e) => onUpdate(['contact', 'hotline'], e.target.value)}
                            placeholder='1900123456'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Hotline (Hiển thị)
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.contact?.hotlineDisplay || ''}
                            onChange={(e) =>
                                onUpdate(['contact', 'hotlineDisplay'], e.target.value)
                            }
                            placeholder='1900 123 456'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Email liên hệ
                        </label>
                        <DarkOutlineInput
                            type='email'
                            value={formData.contact?.email || ''}
                            onChange={(e) => onUpdate(['contact', 'email'], e.target.value)}
                            placeholder='support@example.com'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Zalo URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.contact?.zalo || ''}
                            onChange={(e) => onUpdate(['contact', 'zalo'], e.target.value)}
                            placeholder='https://zalo.me/0123456789'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Facebook URL
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.contact?.facebook || ''}
                            onChange={(e) =>
                                onUpdate(['contact', 'facebook'], e.target.value)
                            }
                            placeholder='https://facebook.com/page'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Giờ làm việc
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.contact?.workingHours || ''}
                            onChange={(e) =>
                                onUpdate(['contact', 'workingHours'], e.target.value)
                            }
                            placeholder='8:00 - 22:00 (T2-CN)'
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
