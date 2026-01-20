// frontend/src/components/LegalDialogs.tsx
import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { getPublicSystemConfig } from '../lib/api/system-config'

interface LegalDialogsProps {
    isTermsOpen: boolean
    isPrivacyOpen: boolean
    onTermsOpenChange: (open: boolean) => void
    onPrivacyOpenChange: (open: boolean) => void
}

export function LegalDialogs({
    isTermsOpen,
    isPrivacyOpen,
    onTermsOpenChange,
    onPrivacyOpenChange,
}: LegalDialogsProps) {
    const [termsContent, setTermsContent] = useState<string | null>(null)
    const [privacyContent, setPrivacyContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Load legal content when dialogs open to get latest data
    useEffect(() => {
        if (isTermsOpen || isPrivacyOpen) {
            const loadLegalContent = async () => {
                try {
                    setLoading(true)
                    const config = await getPublicSystemConfig()
                    console.log('📥 LegalDialogs - Loaded config:', config)
                    console.log('📥 LegalDialogs - Legal data:', config.legal)
                    
                    if (config.legal) {
                        // Set content if exists and is not empty
                        const terms = config.legal.termsOfService
                        const privacy = config.legal.privacyPolicy
                        
                        setTermsContent(
                            terms && terms.trim() !== '' ? terms : null
                        )
                        setPrivacyContent(
                            privacy && privacy.trim() !== '' ? privacy : null
                        )
                        
                        console.log('📥 LegalDialogs - Terms content:', terms ? 'Has content' : 'No content')
                        console.log('📥 LegalDialogs - Privacy content:', privacy ? 'Has content' : 'No content')
                    } else {
                        setTermsContent(null)
                        setPrivacyContent(null)
                    }
                } catch (error) {
                    console.error('Failed to load legal content:', error)
                    setTermsContent(null)
                    setPrivacyContent(null)
                } finally {
                    setLoading(false)
                }
            }
            loadLegalContent()
        }
    }, [isTermsOpen, isPrivacyOpen])


    return (
        <>
            {/* Terms Dialog */}
            <Dialog open={isTermsOpen} onOpenChange={onTermsOpenChange}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Điều khoản sử dụng
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ
                        </DialogDescription>
                    </DialogHeader>
                    {loading ? (
                        <div className='mt-6 text-center text-gray-400'>
                            Đang tải...
                        </div>
                    ) : termsContent && termsContent.trim() !== '' ? (
                        <div
                            className='mt-6 prose prose-invert max-w-none'
                            style={{
                                '--tw-prose-headings': '#ffffff',
                                '--tw-prose-bold': '#ffffff',
                                '--tw-prose-body': '#d1d5db',
                                '--tw-prose-links': '#3b82f6',
                            } as React.CSSProperties}
                            dangerouslySetInnerHTML={{ __html: termsContent }}
                        />
                    ) : (
                        <div className='mt-6 text-center text-gray-400 py-8'>
                            <p>Nội dung điều khoản sử dụng chưa được cập nhật.</p>
                            <p className='text-sm mt-2'>Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Privacy Dialog */}
            <Dialog open={isPrivacyOpen} onOpenChange={onPrivacyOpenChange}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-custom'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D]'>
                        <DialogTitle className='text-2xl font-bold text-white mb-2'>
                            Chính sách bảo mật
                        </DialogTitle>
                        <DialogDescription className='text-sm text-gray-400'>
                            Chúng tôi cam kết bảo vệ quyền riêng tư của bạn
                        </DialogDescription>
                    </DialogHeader>
                    {loading ? (
                        <div className='mt-6 text-center text-gray-400'>
                            Đang tải...
                        </div>
                    ) : privacyContent && privacyContent.trim() !== '' ? (
                        <div
                            className='mt-6 prose prose-invert max-w-none'
                            style={{
                                '--tw-prose-headings': '#ffffff',
                                '--tw-prose-bold': '#ffffff',
                                '--tw-prose-body': '#d1d5db',
                                '--tw-prose-links': '#3b82f6',
                            } as React.CSSProperties}
                            dangerouslySetInnerHTML={{ __html: privacyContent }}
                        />
                    ) : (
                        <div className='mt-6 text-center text-gray-400 py-8'>
                            <p>Nội dung chính sách bảo mật chưa được cập nhật.</p>
                            <p className='text-sm mt-2'>Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
