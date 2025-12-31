import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { RefundRequest } from '../../lib/api/refund-requests'
import { refundRequestsApi } from '../../lib/api/refund-requests'
import { toast } from 'sonner'

interface RefundOfferDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    refundRequest: RefundRequest | null
    onActionComplete?: () => void
}

export function RefundOfferDialog({
    isOpen,
    setIsOpen,
    refundRequest,
    onActionComplete,
}: RefundOfferDialogProps) {
    const [loading, setLoading] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

    // Calculate time remaining
    useEffect(() => {
        if (!isOpen || !refundRequest?.offerExpiresAt) {
            setTimeRemaining(null)
            return
        }

        const updateTimeRemaining = () => {
            const now = new Date().getTime()
            const expiresAt = new Date(refundRequest.offerExpiresAt!).getTime()
            const remaining = Math.max(0, expiresAt - now)
            setTimeRemaining(remaining)
        }

        updateTimeRemaining()
        const interval = setInterval(updateTimeRemaining, 1000)

        return () => clearInterval(interval)
    }, [isOpen, refundRequest?.offerExpiresAt])

    const formatTimeRemaining = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((ms % (1000 * 60)) / 1000)

        if (hours > 0) {
            return `${hours} giờ ${minutes} phút ${seconds} giây`
        }
        if (minutes > 0) {
            return `${minutes} phút ${seconds} giây`
        }
        return `${seconds} giây`
    }

    const isExpired = timeRemaining !== null && timeRemaining === 0

    const handleAccept = async () => {
        if (!refundRequest) return

        try {
            setLoading(true)
            await refundRequestsApi.acceptRefundOffer(refundRequest.id)
            toast.success('Bạn đã chấp nhận đề xuất hoàn tiền')
            setIsOpen(false)
            onActionComplete?.()
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    'Có lỗi xảy ra khi chấp nhận đề xuất'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!refundRequest) return

        try {
            setLoading(true)
            await refundRequestsApi.rejectRefundOffer(refundRequest.id)
            toast.info('Bạn đã từ chối đề xuất hoàn tiền')
            setIsOpen(false)
            onActionComplete?.()
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    'Có lỗi xảy ra khi từ chối đề xuất'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setIsOpen(false)
        }
    }

    if (!refundRequest) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white sm:max-w-[500px]'>
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                        Đề xuất hoàn tiền một phần
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Quản trị viên đã gửi cho bạn một đề xuất hoàn tiền. Vui
                        lòng xem xét và quyết định.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                    {/* Order Info */}
                    {refundRequest.order && (
                        <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] p-4'>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center'>
                                    <span className='text-sm text-gray-400'>
                                        Mã đơn hàng:
                                    </span>
                                    <span className='text-sm font-mono text-white'>
                                        {refundRequest.order.orderCode}
                                    </span>
                                </div>
                                {refundRequest.order.course && (
                                    <div className='flex justify-between items-center'>
                                        <span className='text-sm text-gray-400'>
                                            Khóa học:
                                        </span>
                                        <span className='text-sm text-white'>
                                            {refundRequest.order.course.title}
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
                                        }).format(
                                            refundRequest.order.finalPrice
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Offer Details */}
                    <div className='rounded-lg bg-yellow-600/20 border border-yellow-500/40 p-4'>
                        <div className='space-y-3'>
                            <div className='flex items-start gap-3'>
                                <CheckCircle2 className='h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0' />
                                <div className='flex-1 space-y-2'>
                                    <div>
                                        <p className='text-sm font-medium text-yellow-300 mb-2'>
                                            Đề xuất hoàn tiền
                                        </p>
                                        <div className='text-2xl font-bold text-white'>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(
                                                refundRequest.suggestedRefundAmount ||
                                                    0
                                            )}
                                        </div>
                                    </div>
                                    {refundRequest.progressPercentage !==
                                        undefined && (
                                        <div className='flex justify-between items-center text-xs'>
                                            <span className='text-gray-400'>
                                                Tiến độ khóa học:
                                            </span>
                                            <span className='text-white'>
                                                {
                                                    refundRequest.progressPercentage
                                                }
                                                %
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time Remaining */}
                    {refundRequest.offerExpiresAt && (
                        <div
                            className={`rounded-lg border p-3 ${
                                isExpired
                                    ? 'bg-red-600/20 border-red-500/40'
                                    : 'bg-blue-600/20 border-blue-500/40'
                            }`}
                        >
                            <div className='flex items-center gap-2'>
                                <Clock
                                    className={`h-4 w-4 ${
                                        isExpired
                                            ? 'text-red-400'
                                            : 'text-blue-400'
                                    }`}
                                />
                                <div className='flex-1'>
                                    <p
                                        className={`text-xs font-medium ${
                                            isExpired
                                                ? 'text-red-300'
                                                : 'text-blue-300'
                                        }`}
                                    >
                                        {isExpired
                                            ? 'Đề xuất đã hết hạn'
                                            : 'Thời gian còn lại:'}
                                    </p>
                                    {!isExpired && timeRemaining !== null && (
                                        <p className='text-sm font-mono text-white mt-1'>
                                            {formatTimeRemaining(timeRemaining)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    {refundRequest.adminNotes && (
                        <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] p-3'>
                            <p className='text-xs text-gray-400 mb-1'>
                                Ghi chú từ quản trị viên:
                            </p>
                            <p className='text-sm text-white'>
                                {refundRequest.adminNotes}
                            </p>
                        </div>
                    )}

                    {/* Warning */}
                    <div className='rounded-lg bg-yellow-600/20 border border-yellow-500/40 p-3'>
                        <p className='text-xs text-yellow-300'>
                            <strong>Lưu ý:</strong> Bạn có 48 giờ để quyết định.
                            Nếu bạn từ chối hoặc hết hạn, yêu cầu hoàn tiền sẽ
                            được quản trị viên xem xét lại.
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
                        Để sau
                    </Button>
                    <Button
                        variant='outline'
                        onClick={handleReject}
                        disabled={loading || isExpired}
                        className='border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400/60 hover:text-red-300'
                    >
                        {loading ? (
                            <>
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <XCircle className='h-4 w-4 mr-2' />
                                Từ chối
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={loading || isExpired}
                        className='bg-green-600 hover:bg-green-700 text-white'
                    >
                        {loading ? (
                            <>
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className='h-4 w-4 mr-2' />
                                Chấp nhận
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
