import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { OrderSummary } from '../../Payment/OrderSummary'
import { formatPrice } from '../../../lib/courseUtils'
import { formatDateTime } from '../../../lib/utils'
import type { RefundRequest } from '../../../lib/api/refund-requests'
import type { Course } from '../../../lib/api/types'
import {
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    CreditCard,
    Wallet,
    Loader2,
    AlertCircle,
} from 'lucide-react'

function getStatusBadge(status: string) {
    switch (status) {
        case 'PAID':
            return (
                <Badge className='bg-green-600/20 text-green-300 border border-green-500/40 flex items-center gap-1.5'>
                    <CheckCircle className='h-3 w-3' />
                    Đã thanh toán
                </Badge>
            )
        case 'PENDING':
            return (
                <Badge className='bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1.5'>
                    <Clock className='h-3 w-3' />
                    Đang chờ
                </Badge>
            )
        case 'FAILED':
            return (
                <Badge className='bg-red-600/20 text-red-300 border border-red-500/40 flex items-center gap-1.5'>
                    <XCircle className='h-3 w-3' />
                    Thất bại
                </Badge>
            )
        case 'REFUNDED':
            return (
                <Badge className='bg-purple-600/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Đã hoàn tiền
                </Badge>
            )
        case 'PARTIALLY_REFUNDED':
            return (
                <Badge className='bg-orange-600/20 text-orange-300 border border-orange-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Hoàn tiền một phần
                </Badge>
            )
        case 'REFUND_PENDING':
            return (
                <Badge className='bg-yellow-600/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1.5'>
                    <Clock className='h-3 w-3' />
                    Đang chờ hoàn tiền
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-600/20 text-gray-300 border border-gray-500/40'>
                    {status}
                </Badge>
            )
    }
}

function getRefundRequestStatusBadge(status: RefundRequest['status']) {
    switch (status) {
        case 'PENDING':
            return (
                <Badge className='bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'>
                    Đang chờ xử lý
                </Badge>
            )
        case 'APPROVED':
            return (
                <Badge className='bg-green-600/20 text-green-300 border border-green-500/40'>
                    Đã hoàn tiền
                </Badge>
            )
        case 'REJECTED':
            return (
                <Badge className='bg-red-600/20 text-red-300 border border-red-500/40'>
                    Đã từ chối
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-600/20 text-gray-300 border border-gray-500/40'>
                    {status}
                </Badge>
            )
    }
}

function getGatewayIcon(gateway: string) {
    switch (gateway) {
        case 'VNPay':
            return <CreditCard className='h-4 w-4' />
        case 'MoMo':
            return <Wallet className='h-4 w-4' />
        default:
            return <CreditCard className='h-4 w-4' />
    }
}

interface RefundRequestDetailDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    refundRequest: RefundRequest | null
    onProcessRequest?: (
        requestId: number,
        action: 'APPROVE' | 'REJECT',
        customAmount?: number,
        notes?: string
    ) => Promise<void>
    processing?: boolean
}

export function RefundRequestDetailDialog({
    isOpen,
    setIsOpen,
    refundRequest,
    onProcessRequest,
    processing = false,
}: RefundRequestDetailDialogProps) {
    const [showProcessDialog, setShowProcessDialog] = useState(false)
    const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT'>(
        'APPROVE'
    )
    const [customAmount, setCustomAmount] = useState<string>('')
    const [adminNotes, setAdminNotes] = useState<string>('')

    if (!refundRequest || !refundRequest.order) {
        return null
    }

    const order = refundRequest.order
    const course = order.course as Course | undefined

    const canProcess = refundRequest.status === 'PENDING'

    const cannotProcessReason = null

    const handleProcessClick = (action: 'APPROVE' | 'REJECT') => {
        setProcessAction(action)
        if (action === 'APPROVE') {
            setCustomAmount(
                refundRequest.requestedRefundAmount?.toString() ||
                    refundRequest.suggestedRefundAmount?.toString() ||
                    ''
            )
        } else {
            setCustomAmount('')
        }
        setAdminNotes('')
        setShowProcessDialog(true)
    }

    const handleConfirmProcess = async () => {
        if (!onProcessRequest) return

        if (processAction === 'APPROVE') {
            const amount = parseFloat(customAmount)
            if (isNaN(amount) || amount <= 0) {
                return
            }
            await onProcessRequest(
                refundRequest.id,
                'APPROVE',
                amount,
                adminNotes.trim() || undefined
            )
        } else {
            await onProcessRequest(
                refundRequest.id,
                'REJECT',
                undefined,
                adminNotes.trim() || undefined
            )
        }

        setShowProcessDialog(false)
        setCustomAmount('')
        setAdminNotes('')
    }

    const maxRefundAmount = order.finalPrice - (order.refundAmount || 0)
    const suggestedAmount =
        refundRequest.requestedRefundAmount ||
        refundRequest.suggestedRefundAmount ||
        maxRefundAmount

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                        Chi tiết yêu cầu hoàn tiền
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Mã đơn hàng: {order.orderCode}
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-6 mt-4'>
                    {/* Refund Request Info */}
                    <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white text-lg'>
                                Thông tin yêu cầu hoàn tiền
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Trạng thái yêu cầu
                                    </p>
                                    <div>
                                        {getRefundRequestStatusBadge(
                                            refundRequest.status
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Loại hoàn tiền
                                    </p>
                                    <Badge
                                        variant='outline'
                                        className='border-[#2D2D2D] text-gray-300'
                                    >
                                        {refundRequest.refundType === 'FULL'
                                            ? 'Hoàn tiền toàn bộ'
                                            : 'Hoàn tiền một phần'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Ngày tạo yêu cầu
                                    </p>
                                    <p className='text-sm text-white flex items-center gap-1.5'>
                                        <Calendar className='h-4 w-4' />
                                        {formatDateTime(
                                            refundRequest.createdAt
                                        )}
                                    </p>
                                </div>
                                {refundRequest.processedAt && (
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1'>
                                            Ngày xử lý
                                        </p>
                                        <p className='text-sm text-white flex items-center gap-1.5'>
                                            <Calendar className='h-4 w-4' />
                                            {formatDateTime(
                                                refundRequest.processedAt
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {refundRequest.suggestedRefundAmount && (
                                <>
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-gray-400'>
                                            <span>Số tiền đề xuất:</span>
                                            <span className='text-green-400 font-semibold'>
                                                {formatPrice(
                                                    refundRequest.suggestedRefundAmount
                                                )}
                                            </span>
                                        </div>
                                        {refundRequest.requestedRefundAmount && (
                                            <div className='flex justify-between text-gray-400'>
                                                <span>Số tiền yêu cầu:</span>
                                                <span className='text-white font-semibold'>
                                                    {formatPrice(
                                                        refundRequest.requestedRefundAmount
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {refundRequest.progressPercentage !==
                                            undefined && (
                                            <div className='flex justify-between text-gray-400'>
                                                <span>Tiến độ khóa học:</span>
                                                <span className='text-white'>
                                                    {
                                                        refundRequest.progressPercentage
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {refundRequest.reason && (
                                <>
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                            <FileText className='h-4 w-4' />
                                            Lý do hoàn tiền
                                        </p>
                                        <p className='text-sm text-white mt-2'>
                                            {refundRequest.reason}
                                        </p>
                                    </div>
                                </>
                            )}


                            {refundRequest.adminNotes && (
                                <>
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                            <FileText className='h-4 w-4' />
                                            Ghi chú từ admin
                                        </p>
                                        <p className='text-sm text-white mt-2'>
                                            {refundRequest.adminNotes}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Info */}
                    <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white text-lg'>
                                Thông tin đơn hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Trạng thái
                                    </p>
                                    <div>
                                        {getStatusBadge(
                                            order.paymentStatus || 'PENDING'
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Phương thức thanh toán
                                    </p>
                                    <Badge
                                        variant='outline'
                                        className='border-[#2D2D2D] text-gray-300 flex items-center gap-1.5 w-fit'
                                    >
                                        {getGatewayIcon(
                                            order.paymentGateway || 'VNPay'
                                        )}
                                        {order.paymentGateway || 'VNPay'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Ngày tạo
                                    </p>
                                    <p className='text-sm text-white flex items-center gap-1.5'>
                                        <Calendar className='h-4 w-4' />
                                        {formatDateTime(order.createdAt)}
                                    </p>
                                </div>
                                {order.paidAt && (
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1'>
                                            Ngày thanh toán
                                        </p>
                                        <p className='text-sm text-white flex items-center gap-1.5'>
                                            <Calendar className='h-4 w-4' />
                                            {formatDateTime(order.paidAt)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator className='bg-[#2D2D2D]' />

                            <div className='space-y-2'>
                                <div className='flex justify-between text-gray-400'>
                                    <span>Giá gốc:</span>
                                    <span>
                                        {formatPrice(
                                            order.originalPrice ||
                                                order.finalPrice
                                        )}
                                    </span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className='flex justify-between text-green-400'>
                                        <span>Giảm giá:</span>
                                        <span>
                                            -{formatPrice(order.discountAmount)}
                                        </span>
                                    </div>
                                )}
                                <Separator className='bg-[#2D2D2D]' />
                                <div className='flex justify-between items-center'>
                                    <span className='text-lg font-semibold text-white'>
                                        Tổng cộng:
                                    </span>
                                    <span className='text-xl font-bold text-blue-400'>
                                        {formatPrice(order.finalPrice)}
                                    </span>
                                </div>
                            </div>

                            {order.refundAmount && order.refundAmount > 0 && (
                                <>
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div className='flex justify-between text-purple-400'>
                                        <span>Đã hoàn tiền:</span>
                                        <span className='font-semibold'>
                                            {formatPrice(order.refundAmount)}
                                        </span>
                                    </div>
                                    {order.refundedAt && (
                                        <p className='text-xs text-gray-500'>
                                            Ngày hoàn tiền:{' '}
                                            {formatDateTime(order.refundedAt)}
                                        </p>
                                    )}
                                </>
                            )}

                            {order.notes && (
                                <>
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                            <FileText className='h-4 w-4' />
                                            Ghi chú
                                        </p>
                                        <p className='text-sm text-white'>
                                            {order.notes}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Summary (Course Details) */}
                    {course && (
                        <OrderSummary course={course as any} loading={false} />
                    )}

                    {/* Process Actions - Only for PENDING requests */}
                    {refundRequest.status === 'PENDING' && (
                        <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-white text-lg'>
                                    Xử lý yêu cầu
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                {cannotProcessReason && (
                                    <div className='p-3 bg-yellow-600/20 border border-yellow-500/40 rounded-lg'>
                                        <div className='flex items-start gap-2'>
                                            <AlertCircle className='h-4 w-4 text-yellow-400 mt-0.5 shrink-0' />
                                            <p className='text-sm text-yellow-300'>
                                                {cannotProcessReason}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {canProcess && (
                                    <div className='flex gap-3'>
                                        <Button
                                            onClick={() =>
                                                handleProcessClick('APPROVE')
                                            }
                                            disabled={processing}
                                            className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                                        >
                                            <CheckCircle className='h-4 w-4 mr-2' />
                                            Duyệt yêu cầu
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                handleProcessClick('REJECT')
                                            }
                                            disabled={processing}
                                            variant='outline'
                                            className='flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400/60 hover:text-red-300'
                                        >
                                            <XCircle className='h-4 w-4 mr-2' />
                                            Từ chối
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Process Confirmation Dialog */}
                <Dialog
                    open={showProcessDialog}
                    onOpenChange={setShowProcessDialog}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md'>
                        <DialogHeader>
                            <DialogTitle className='text-lg'>
                                {processAction === 'APPROVE'
                                    ? 'Xác nhận duyệt yêu cầu hoàn tiền'
                                    : 'Xác nhận từ chối yêu cầu hoàn tiền'}
                            </DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                {processAction === 'APPROVE'
                                    ? 'Bạn có chắc chắn muốn duyệt yêu cầu hoàn tiền này?'
                                    : 'Bạn có chắc chắn muốn từ chối yêu cầu hoàn tiền này?'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className='space-y-4 py-4'>
                            {processAction === 'APPROVE' && (
                                <div className='space-y-2'>
                                    <label className='text-sm text-gray-400'>
                                        Số tiền hoàn lại (VND){' '}
                                        <span className='text-red-400'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        value={customAmount}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /[^0-9.]/g,
                                                    ''
                                                )
                                            const numValue = parseFloat(value)
                                            if (
                                                !isNaN(numValue) &&
                                                numValue >= 0 &&
                                                numValue <= maxRefundAmount
                                            ) {
                                                setCustomAmount(value)
                                            } else if (value === '') {
                                                setCustomAmount('')
                                            }
                                        }}
                                        placeholder='Nhập số tiền'
                                        className='w-full px-3 py-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                    <p className='text-xs text-gray-500'>
                                        Đề xuất: {formatPrice(suggestedAmount)}{' '}
                                        | Tối đa: {formatPrice(maxRefundAmount)}
                                    </p>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                            setCustomAmount(
                                                suggestedAmount.toString()
                                            )
                                        }
                                        className='w-full'
                                    >
                                        Sử dụng số tiền đề xuất
                                    </Button>
                                </div>
                            )}

                            <div className='space-y-2'>
                                <label className='text-sm text-gray-400'>
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) =>
                                        setAdminNotes(e.target.value)
                                    }
                                    placeholder='Nhập ghi chú...'
                                    rows={3}
                                    className='w-full px-3 py-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                />
                            </div>

                            {processAction === 'REJECT' && (
                                <div className='p-3 bg-red-600/20 border border-red-500/40 rounded-lg'>
                                    <p className='text-xs text-red-300'>
                                        <strong className='text-red-400'>
                                            Lưu ý:
                                        </strong>{' '}
                                        Khi từ chối, trạng thái đơn hàng sẽ được
                                        chuyển về "Đã thanh toán" và học viên
                                        vẫn có quyền truy cập khóa học.
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant='outline'
                                onClick={() => {
                                    setShowProcessDialog(false)
                                    setCustomAmount('')
                                    setAdminNotes('')
                                }}
                                disabled={processing}
                                className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F]'
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleConfirmProcess}
                                disabled={
                                    processing ||
                                    (processAction === 'APPROVE' &&
                                        (!customAmount ||
                                            parseFloat(customAmount) <= 0 ||
                                            parseFloat(customAmount) >
                                                maxRefundAmount))
                                }
                                className={
                                    processAction === 'APPROVE'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : processAction === 'APPROVE' ? (
                                    <>
                                        <CheckCircle className='h-4 w-4 mr-2' />
                                        Xác nhận duyệt
                                    </>
                                ) : (
                                    <>
                                        <XCircle className='h-4 w-4 mr-2' />
                                        Xác nhận từ chối
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}
