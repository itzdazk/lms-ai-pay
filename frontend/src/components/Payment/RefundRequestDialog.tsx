import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Order } from '../../lib/api/types'

interface RefundRequestDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    order: Order | null
    onSubmit: (reason: string) => Promise<void>
    loading?: boolean
}

export function RefundRequestDialog({
    isOpen,
    setIsOpen,
    order,
    onSubmit,
    loading = false,
}: RefundRequestDialogProps) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setError(null)

        if (!reason.trim()) {
            setError('Vui lòng nhập lý do hoàn tiền')
            return
        }

        if (reason.trim().length < 10) {
            setError('Lý do hoàn tiền phải có ít nhất 10 ký tự')
            return
        }

        if (reason.trim().length > 1000) {
            setError('Lý do hoàn tiền không được vượt quá 1000 ký tự')
            return
        }

        try {
            await onSubmit(reason.trim())
            setReason('')
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu hoàn tiền')
        }
    }

    const handleClose = () => {
        if (!loading) {
            setReason('')
            setError(null)
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white sm:max-w-[500px]'>
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                        Yêu cầu hoàn tiền
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Vui lòng cung cấp lý do bạn muốn hoàn tiền cho đơn hàng
                        này. Yêu cầu của bạn sẽ được xem xét bởi quản trị viên.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                    {order && (
                        <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] p-4'>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-gray-400'>
                                        Mã đơn hàng:
                                    </span>
                                    <span className='text-sm font-mono text-white'>
                                        {order.orderCode}
                                    </span>
                                </div>
                                {order.course && (
                                    <div className='flex justify-between items-center'>
                                        <span className='text-sm text-gray-400'>
                                            Khóa học:
                                        </span>
                                        <span className='text-sm text-white'>
                                            {order.course.title}
                                        </span>
                                    </div>
                                )}
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-gray-400'>
                                        Giá trị đơn:
                                    </span>
                                    <span className='text-sm font-semibold text-white'>
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        }).format(order.finalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='space-y-2'>
                        <Label htmlFor='reason' className='text-gray-300'>
                            Lý do hoàn tiền <span className='text-red-400'>*</span>
                        </Label>
                        <Textarea
                            id='reason'
                            placeholder='Vui lòng mô tả chi tiết lý do bạn muốn hoàn tiền (tối thiểu 10 ký tự)...'
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value)
                                setError(null)
                            }}
                            className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[120px] resize-none'
                            disabled={loading}
                        />
                        <div className='flex justify-between items-center text-xs text-gray-400'>
                            <span>
                                {error && (
                                    <span className='text-red-400 flex items-center gap-1'>
                                        <AlertCircle className='h-3 w-3' />
                                        {error}
                                    </span>
                                )}
                            </span>
                            <span>
                                {reason.length}/1000 ký tự
                            </span>
                        </div>
                    </div>

                    <div className='rounded-lg bg-yellow-600/20 border border-yellow-500/40 p-3'>
                        <p className='text-xs text-yellow-300'>
                            <strong>Lưu ý:</strong> Yêu cầu hoàn tiền sẽ bị từ
                            chối tự động nếu tiến độ khóa học của bạn đạt 50%
                            trở lên. Nếu tiến độ dưới 50%, yêu cầu sẽ được gửi
                            đến quản trị viên để xem xét.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={handleClose}
                        disabled={loading}
                        className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F]'
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className='bg-blue-600 hover:bg-blue-700 text-white'
                    >
                        {loading ? (
                            <>
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                Đang gửi...
                            </>
                        ) : (
                            'Gửi yêu cầu'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

