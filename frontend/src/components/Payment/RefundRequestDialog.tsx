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
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import type { Order } from '../../lib/api/types'
import {
    refundRequestsApi,
    type RefundReasonType,
    type RefundEligibility,
} from '../../lib/api/refund-requests'

interface RefundRequestDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    order: Order | null
    onSubmit: (reason: string, reasonType?: RefundReasonType) => Promise<void>
    loading?: boolean
}

const REASON_TYPE_OPTIONS: {
    value: RefundReasonType
    label: string
}[] = [
    { value: 'MEDICAL', label: 'Vấn đề sức khỏe' },
    { value: 'FINANCIAL_EMERGENCY', label: 'Khó khăn tài chính' },
    { value: 'DISSATISFACTION', label: 'Không hài lòng với khóa học' },
    { value: 'OTHER', label: 'Lý do khác' },
]

export function RefundRequestDialog({
    isOpen,
    setIsOpen,
    order,
    onSubmit,
    loading = false,
}: RefundRequestDialogProps) {
    const [reason, setReason] = useState('')
    const [reasonType, setReasonType] = useState<RefundReasonType>('OTHER')
    const [error, setError] = useState<string | null>(null)
    const [eligibility, setEligibility] = useState<RefundEligibility | null>(
        null
    )
    const [checkingEligibility, setCheckingEligibility] = useState(false)
    const [showRefundRules, setShowRefundRules] = useState(true)

    // Check eligibility when dialog opens
    useEffect(() => {
        if (isOpen && order) {
            checkEligibility()
        } else {
            // Reset state when dialog closes
            setReason('')
            setReasonType('OTHER')
            setError(null)
            setEligibility(null)
            setShowRefundRules(false)
        }
    }, [isOpen, order])

    const checkEligibility = async () => {
        if (!order) return

        try {
            setCheckingEligibility(true)
            const result = await refundRequestsApi.getRefundEligibility(
                order.id
            )
            setEligibility(result)
        } catch (err: any) {
            console.error('Error checking eligibility:', err)
            setError(
                'Không thể kiểm tra điều kiện hoàn tiền. Vui lòng thử lại.'
            )
        } finally {
            setCheckingEligibility(false)
        }
    }

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

        if (!eligibility?.eligible) {
            setError('Đơn hàng này không đủ điều kiện để hoàn tiền')
            return
        }

        try {
            await onSubmit(reason.trim(), reasonType)
            setReason('')
            setReasonType('OTHER')
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu hoàn tiền')
        }
    }

    const handleClose = () => {
        if (!loading && !checkingEligibility) {
            setReason('')
            setReasonType('OTHER')
            setError(null)
            setEligibility(null)
            setShowRefundRules(false)
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white sm:max-w-[900px] max-h-[90vh] flex flex-col'>
                <DialogHeader className='shrink-0'>
                    <DialogTitle className='text-xl font-semibold'>
                        Yêu cầu hoàn tiền
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Vui lòng cung cấp lý do bạn muốn hoàn tiền cho đơn hàng
                        này. Yêu cầu của bạn sẽ được xem xét bởi quản trị viên.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4 overflow-y-auto flex-1 min-h-0 scrollbar-custom'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        {order && (
                            <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] p-4'>
                                <h4 className='text-sm font-semibold text-white mb-3'>
                                    Thông tin đơn hàng
                                </h4>
                                <div className='space-y-2'>
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-gray-400'>Mã đơn hàng:</span>
                                        <span className='font-mono text-white'>
                                            {order.orderCode}
                                        </span>
                                    </div>
                                    {order.course && (
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-gray-400'>Khóa học:</span>
                                            <span className='text-white text-right line-clamp-2 max-w-[220px]'>
                                                {order.course.title}
                                            </span>
                                        </div>
                                    )}
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-gray-400'>Giá trị đơn:</span>
                                        <span className='font-semibold text-white'>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(order.finalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Eligibility Check Result */}
                        <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] p-4 min-h-[150px]'>
                            <h4 className='text-sm font-semibold text-white mb-3 flex items-center gap-2'>
                                <Info className='h-4 w-4 text-blue-400' />
                                Kiểm tra điều kiện hoàn tiền
                            </h4>
                            {checkingEligibility && (
                                <div className='rounded-lg bg-blue-600/20 border border-blue-500/40 p-3'>
                                    <div className='flex items-center gap-2 text-blue-300'>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        <span className='text-sm'>
                                            Đang kiểm tra điều kiện hoàn tiền...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {eligibility && !checkingEligibility && (
                                <div
                                    className={`rounded-lg border p-3 ${
                                        eligibility.eligible
                                            ? eligibility.type === 'FULL'
                                                ? 'bg-green-600/20 border-green-500/40'
                                                : 'bg-yellow-600/20 border-yellow-500/40'
                                            : 'bg-red-600/20 border-red-500/40'
                                    }`}
                                >
                                    <div className='flex items-start gap-2'>
                                        {eligibility.eligible ? (
                                            eligibility.type === 'FULL' ? (
                                                <CheckCircle2 className='h-5 w-5 text-green-400 mt-0.5 shrink-0' />
                                            ) : (
                                                <Info className='h-5 w-5 text-yellow-400 mt-0.5 shrink-0' />
                                            )
                                        ) : (
                                            <XCircle className='h-5 w-5 text-red-400 mt-0.5 shrink-0' />
                                        )}
                                        <div className='flex-1 space-y-2'>
                                            <p
                                                className={`text-sm font-medium ${
                                                    eligibility.eligible
                                                        ? eligibility.type === 'FULL'
                                                            ? 'text-green-300'
                                                            : 'text-yellow-300'
                                                        : 'text-red-300'
                                                }`}
                                            >
                                                {eligibility.message}
                                            </p>
                                            {eligibility.eligible &&
                                                eligibility.suggestedAmount !== null && (
                                                    <div className='grid grid-cols-2 gap-2 text-xs'>
                                                        <div className='space-y-1'>
                                                            <span className='text-gray-400 block'>
                                                                Loại hoàn tiền:
                                                            </span>
                                                            <span className='font-semibold text-white'>
                                                                {eligibility.type === 'FULL'
                                                                    ? 'Hoàn tiền toàn bộ'
                                                                    : 'Hoàn tiền một phần'}
                                                            </span>
                                                        </div>
                                                        <div className='space-y-1'>
                                                            <span className='text-gray-400 block'>
                                                                Số tiền đề xuất:
                                                            </span>
                                                            <span className='font-semibold text-green-300'>
                                                                {new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND',
                                                                }).format(eligibility.suggestedAmount)}
                                                            </span>
                                                        </div>
                                                        {eligibility.progressPercentage !== undefined && (
                                                            <div className='space-y-1'>
                                                                <span className='text-gray-400 block'>
                                                                    Tiến độ khóa học:
                                                                </span>
                                                                <span className='text-white'>
                                                                    {eligibility.progressPercentage}%
                                                                </span>
                                                            </div>
                                                        )}
                                                        {eligibility.daysSincePayment !== undefined && (
                                                            <div className='space-y-1'>
                                                                <span className='text-gray-400 block'>
                                                                    Số ngày từ khi thanh toán:
                                                                </span>
                                                                <span className='text-white'>
                                                                    {eligibility.daysSincePayment} ngày
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Refund Rules Section - always visible for readability */}
                    <div className='rounded-lg bg-[#1F1F1F] border border-[#2D2D2D] overflow-hidden'>
                        <div className='w-full flex items-center justify-between gap-2 p-4 border-b border-[#2D2D2D]'>
                            <div className='flex items-center gap-2'>
                                <Info className='h-5 w-5 text-blue-400 shrink-0' />
                                <h3 className='text-base font-semibold text-white text-left'>
                                    Quy định hoàn tiền
                                </h3>
                            </div>
                        </div>

                        <div className='px-4 pb-4 space-y-4 pt-4 grid md:grid-cols-3 gap-3'>
                            {/* Full Refund Rule */}
                            <div className='rounded-md bg-green-600/10 border border-green-500/30 p-3'>
                                <div className='flex items-start gap-2 mb-2'>
                                    <CheckCircle2 className='h-4 w-4 text-green-400 mt-0.5 shrink-0' />
                                    <div className='flex-1'>
                                        <p className='font-semibold text-green-300 mb-1'>
                                            Hoàn tiền 100%
                                        </p>
                                        <ul className='text-gray-300 space-y-1 text-xs list-disc list-inside ml-1'>
                                            <li>
                                                Tiến độ học tập{' '}
                                                <span className='font-semibold text-white'>
                                                    &lt; 20%
                                                </span>
                                            </li>
                                            <li>
                                                Trong vòng{' '}
                                                <span className='font-semibold text-white'>
                                                    7 ngày
                                                </span>{' '}
                                                kể từ khi thanh toán
                                            </li>
                                        </ul>
                                        <div className='mt-2 pt-2 border-top border-green-500/20'>
                                            <p className='text-xs text-gray-400'>
                                                <span className='font-semibold text-green-300'>
                                                    Công thức:
                                                </span>{' '}
                                                <span className='font-mono text-white'>
                                                    Số tiền hoàn = Giá trị đơn hàng
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Partial Refund Rule */}
                            <div className='rounded-md bg-yellow-600/10 border border-yellow-500/30 p-3'>
                                <div className='flex items-start gap-2 mb-2'>
                                    <Info className='h-4 w-4 text-yellow-400 mt-0.5 shrink-0' />
                                    <div className='flex-1'>
                                        <p className='font-semibold text-yellow-300 mb-1'>
                                            Hoàn tiền một phần
                                        </p>
                                        <ul className='text-gray-300 space-y-1 text-xs list-disc list-inside ml-1'>
                                            <li>
                                                Tiến độ học tập{' '}
                                                <span className='font-semibold text-white'>
                                                    &lt; 50%
                                                </span>
                                            </li>
                                            <li>
                                                Trừ{' '}
                                                <span className='font-semibold text-white'>
                                                    20% phí xử lý
                                                </span>
                                            </li>
                                        </ul>
                                        <div className='mt-2 pt-2 border-top border-yellow-500/20'>
                                            <p className='text-xs text-gray-400'>
                                                <span className='font-semibold text-yellow-300'>
                                                    Công thức:
                                                </span>{' '}
                                                <span className='font-mono text-white'>
                                                    Số tiền hoàn = (Giá trị đơn hàng × (1 - Tiến độ học)) × 80%
                                                </span>
                                            </p>
                                            <p className='text-xs text-gray-500 mt-1 ml-1'>
                                                * 80% = 100% - 20% phí xử lý
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* No Refund Rule */}
                            <div className='rounded-md bg-red-600/10 border border-red-500/30 p-3'>
                                <div className='flex items-start gap-2 mb-2'>
                                    <XCircle className='h-4 w-4 text-red-400 mt-0.5 shrink-0' />
                                    <div className='flex-1'>
                                        <p className='font-semibold text-red-300 mb-1'>
                                            Không được hoàn tiền
                                        </p>
                                        <ul className='text-gray-300 space-y-1 text-xs list-disc list-inside ml-1'>
                                            <li>
                                                Tiến độ học tập{' '}
                                                <span className='font-semibold text-white'>
                                                    ≥ 50%
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className='md:col-span-3 pt-3 border-t border-[#2D2D2D]'>
                                <p className='text-xs text-gray-400'>
                                    <strong className='text-gray-300'>Lưu ý:</strong>{' '}
                                    Yêu cầu hoàn tiền của bạn sẽ được gửi đến quản trị viên để xem xét.
                                    Đối với hoàn tiền một phần, quản trị viên có thể gửi cho bạn một đề xuất
                                    số tiền khác dựa trên tình hình cụ thể.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason Type Select */}
                    <div className='space-y-2'>
                        <Label htmlFor='reasonType' className='text-gray-300'>
                            Loại lý do <span className='text-red-400'>*</span>
                        </Label>
                        <Select
                            value={reasonType}
                            onValueChange={(value) =>
                                setReasonType(value as RefundReasonType)
                            }
                            disabled={loading || checkingEligibility}
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Chọn loại lý do' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1F1F1F] border-[#2D2D2D] z-110'>
                                {REASON_TYPE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className='text-white focus:bg-[#2D2D2D]'
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reason Text */}
                    <div className='space-y-2'>
                        <Label htmlFor='reason' className='text-gray-300'>
                            Mô tả chi tiết lý do{' '}
                            <span className='text-red-400'>*</span>
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
                            disabled={loading || checkingEligibility}
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
                            <span>{reason.length}/1000 ký tự</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className='shrink-0 border-t border-[#2D2D2D] pt-4 mt-4'>
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
                        disabled={
                            loading ||
                            checkingEligibility ||
                            !reason.trim() ||
                            !eligibility?.eligible
                        }
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
