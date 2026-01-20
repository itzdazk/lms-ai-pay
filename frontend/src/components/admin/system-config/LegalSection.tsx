// frontend/src/components/admin/system-config/LegalSection.tsx
import { useState } from 'react'
import { Eye, Code } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import type { SystemSettings } from '../../../lib/api/system-config'

interface LegalSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
}

export function LegalSection({ formData, onUpdate }: LegalSectionProps) {
    const [previewTerms, setPreviewTerms] = useState(false)
    const [previewPrivacy, setPreviewPrivacy] = useState(false)
    const [previewRefund, setPreviewRefund] = useState(false)

    const renderContent = (content: string | null | undefined) => {
        if (!content || content.trim() === '') {
            return (
                <div className='text-gray-500 italic'>
                    Chưa có nội dung. Vui lòng nhập nội dung ở tab chỉnh sửa.
                </div>
            )
        }
        return (
            <div
                className='prose prose-invert max-w-none text-gray-300'
                dangerouslySetInnerHTML={{ __html: content }}
            />
        )
    }

    return (
        <div className='space-y-6'>
            {/* Điều khoản sử dụng */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>
                                Điều khoản sử dụng
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Nội dung hiển thị trong dialog "Điều khoản sử dụng" (hỗ trợ HTML)
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPreviewTerms(true)}
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
                        >
                            <Eye className='h-4 w-4 mr-2' />
                            Xem trước
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <label className='block text-sm font-medium text-gray-300'>
                                Nội dung (HTML)
                            </label>
                            <span className='text-xs text-gray-500'>
                                {formData.legal?.termsOfService?.length || 0} ký tự
                            </span>
                        </div>
                        <textarea
                            className='w-full min-h-[300px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
                            value={formData.legal?.termsOfService || ''}
                            onChange={(e) =>
                                onUpdate(['legal', 'termsOfService'], e.target.value)
                            }
                            placeholder={`Nhập nội dung điều khoản sử dụng (HTML được hỗ trợ)

Ví dụ HTML:
<h3>1. Chấp nhận điều khoản</h3>
<p>Bằng việc truy cập và sử dụng nền tảng học tập trực tuyến này, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sử dụng được nêu trong tài liệu này.</p>

<h3>2. Tài khoản người dùng</h3>
<p>Bạn chịu trách nhiệm duy trì tính bảo mật của tài khoản và mật khẩu.</p>

Hoặc để trống để sử dụng nội dung mặc định.`}
                        />
                        <p className='text-xs text-gray-500 mt-2'>
                            💡 Tip: Bạn có thể sử dụng HTML để định dạng nội dung. Nếu để trống, hệ thống sẽ sử dụng nội dung mặc định.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Chính sách bảo mật */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>
                                Chính sách bảo mật
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Nội dung hiển thị trong dialog "Chính sách bảo mật" (hỗ trợ HTML)
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPreviewPrivacy(true)}
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
                        >
                            <Eye className='h-4 w-4 mr-2' />
                            Xem trước
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <label className='block text-sm font-medium text-gray-300'>
                                Nội dung (HTML)
                            </label>
                            <span className='text-xs text-gray-500'>
                                {formData.legal?.privacyPolicy?.length || 0} ký tự
                            </span>
                        </div>
                        <textarea
                            className='w-full min-h-[300px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
                            value={formData.legal?.privacyPolicy || ''}
                            onChange={(e) =>
                                onUpdate(['legal', 'privacyPolicy'], e.target.value)
                            }
                            placeholder={`Nhập nội dung chính sách bảo mật (HTML được hỗ trợ)

Ví dụ HTML:
<h3>1. Thu thập thông tin</h3>
<p>Chúng tôi thu thập thông tin cá nhân của bạn khi bạn đăng ký tài khoản, sử dụng dịch vụ, hoặc liên hệ với chúng tôi.</p>

<h3>2. Sử dụng thông tin</h3>
<p>Chúng tôi sử dụng thông tin của bạn để cung cấp, duy trì và cải thiện dịch vụ.</p>

Hoặc để trống để sử dụng nội dung mặc định.`}
                        />
                        <p className='text-xs text-gray-500 mt-2'>
                            💡 Tip: Bạn có thể sử dụng HTML để định dạng nội dung. Nếu để trống, hệ thống sẽ sử dụng nội dung mặc định.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Chính sách hoàn tiền */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>
                                Chính sách hoàn tiền
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Nội dung chính sách hoàn tiền (hỗ trợ HTML)
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setPreviewRefund(true)}
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
                        >
                            <Eye className='h-4 w-4 mr-2' />
                            Xem trước
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <label className='block text-sm font-medium text-gray-300'>
                                Nội dung (HTML)
                            </label>
                            <span className='text-xs text-gray-500'>
                                {formData.legal?.refundPolicy?.length || 0} ký tự
                            </span>
                        </div>
                        <textarea
                            className='w-full min-h-[300px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
                            value={formData.legal?.refundPolicy || ''}
                            onChange={(e) =>
                                onUpdate(['legal', 'refundPolicy'], e.target.value)
                            }
                            placeholder='Nhập nội dung chính sách hoàn tiền (HTML được hỗ trợ)'
                        />
                        <p className='text-xs text-gray-500 mt-2'>
                            💡 Tip: Bạn có thể sử dụng HTML để định dạng nội dung.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialogs */}
            <Dialog open={previewTerms} onOpenChange={setPreviewTerms}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Điều khoản sử dụng (Xem trước)
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Đây là cách nội dung sẽ hiển thị cho người dùng
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6'>
                        {renderContent(formData.legal?.termsOfService)}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={previewPrivacy} onOpenChange={setPreviewPrivacy}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Chính sách bảo mật (Xem trước)
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Đây là cách nội dung sẽ hiển thị cho người dùng
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6'>
                        {renderContent(formData.legal?.privacyPolicy)}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={previewRefund} onOpenChange={setPreviewRefund}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Chính sách hoàn tiền (Xem trước)
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Đây là cách nội dung sẽ hiển thị cho người dùng
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-6'>
                        {renderContent(formData.legal?.refundPolicy)}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
