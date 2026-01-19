// frontend/src/components/admin/system-config/LegalSection.tsx
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import type { SystemSettings } from '../../../lib/api/system-config'

interface LegalSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
}

export function LegalSection({ formData, onUpdate }: LegalSectionProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>Nội dung pháp lý</CardTitle>
                <CardDescription className='text-gray-400'>
                    Các điều khoản và chính sách của hệ thống
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Điều khoản dịch vụ (HTML)
                    </label>
                    <textarea
                        className='w-full min-h-[200px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.legal?.termsOfService || ''}
                        onChange={(e) =>
                            onUpdate(['legal', 'termsOfService'], e.target.value)
                        }
                        placeholder='Nhập nội dung điều khoản dịch vụ (HTML được hỗ trợ)'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Chính sách bảo mật (HTML)
                    </label>
                    <textarea
                        className='w-full min-h-[200px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.legal?.privacyPolicy || ''}
                        onChange={(e) =>
                            onUpdate(['legal', 'privacyPolicy'], e.target.value)
                        }
                        placeholder='Nhập nội dung chính sách bảo mật (HTML được hỗ trợ)'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Chính sách hoàn tiền (HTML)
                    </label>
                    <textarea
                        className='w-full min-h-[200px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={formData.legal?.refundPolicy || ''}
                        onChange={(e) =>
                            onUpdate(['legal', 'refundPolicy'], e.target.value)
                        }
                        placeholder='Nhập nội dung chính sách hoàn tiền (HTML được hỗ trợ)'
                    />
                </div>
            </CardContent>
        </Card>
    )
}
