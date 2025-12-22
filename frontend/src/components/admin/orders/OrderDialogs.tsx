import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Loader2, RotateCcw } from 'lucide-react'
import type { Order } from '../../../lib/api/types'
import { formatDateTime } from '../../../lib/utils'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

interface OrderDialogsProps {
    isRefundDialogOpen: boolean
    setIsRefundDialogOpen: (open: boolean) => void
    selectedOrder: Order | null
    refundAmount: string
    setRefundAmount: (amount: string) => void
    refundReason: string
    setRefundReason: (reason: string) => void
    onConfirmRefund: () => void
    actionLoading: boolean
}

export function OrderDialogs({
    isRefundDialogOpen,
    setIsRefundDialogOpen,
    selectedOrder,
    refundAmount,
    setRefundAmount,
    refundReason,
    setRefundReason,
    onConfirmRefund,
    actionLoading,
}: OrderDialogsProps) {
    const maxRefundAmount = selectedOrder
        ? selectedOrder.finalPrice - selectedOrder.refundAmount
        : 0

    const handleRefundAmountChange = (value: string) => {
        // Only allow numbers and decimal point
        const numericValue = value.replace(/[^0-9.]/g, '')
        if (numericValue === '' || numericValue === '.') {
            setRefundAmount('')
            return
        }

        const numValue = parseFloat(numericValue)
        if (!isNaN(numValue) && numValue >= 0) {
            // Limit to max refund amount
            if (numValue > maxRefundAmount) {
                setRefundAmount(maxRefundAmount.toString())
            } else {
                setRefundAmount(numericValue)
            }
        }
    }

    const handleFullRefund = () => {
        setRefundAmount(maxRefundAmount.toString())
    }

    return (
        <>
            {/* Refund Dialog */}
            <Dialog
                open={isRefundDialogOpen}
                onOpenChange={setIsRefundDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-lg max-h-[90vh] flex flex-col'>
                    <DialogHeader className='shrink-0'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-orange-500/20 rounded-full'>
                                <RotateCcw className='h-5 w-5 text-orange-400' />
                            </div>
                            <div>
                                <DialogTitle className='text-lg'>
                                    Hoàn tiền đơn hàng
                                </DialogTitle>
                                <DialogDescription className='text-gray-400 text-sm'>
                                    Hoàn tiền cho đơn hàng{' '}
                                    {selectedOrder?.orderCode}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className='space-y-3 py-3 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar'>
                            {/* Order Info */}
                            <div className='p-3 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D] space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-400'>
                                        Mã đơn hàng:
                                    </span>
                                    <span className='text-white font-medium'>
                                        {selectedOrder.orderCode}
                                    </span>
                                </div>
                                {selectedOrder.course && (
                                    <div className='flex items-center justify-between'>
                                        <span className='text-gray-400'>
                                            Khóa học:
                                        </span>
                                        <span className='text-white font-medium'>
                                            {selectedOrder.course.title}
                                        </span>
                                    </div>
                                )}
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-400'>
                                        Giá trị đơn hàng:
                                    </span>
                                    <span className='text-white font-medium'>
                                        {formatPrice(selectedOrder.finalPrice)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-400'>
                                        Đã hoàn tiền:
                                    </span>
                                    <span className='text-orange-400 font-medium'>
                                        {formatPrice(
                                            selectedOrder.refundAmount
                                        )}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between border-t border-[#2D2D2D] pt-3'>
                                    <span className='text-gray-400'>
                                        Có thể hoàn tiền:
                                    </span>
                                    <span className='text-green-400 font-bold text-lg'>
                                        {formatPrice(maxRefundAmount)}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-400'>
                                        Ngày tạo:
                                    </span>
                                    <span className='text-gray-300'>
                                        {formatDateTime(
                                            selectedOrder.createdAt
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Refund Amount */}
                            <div className='space-y-1.5'>
                                <Label className='text-gray-400 text-sm'>
                                    Số tiền hoàn lại (VND){' '}
                                    <span className='text-red-400'>*</span>
                                </Label>
                                <div className='flex gap-2'>
                                    <DarkOutlineInput
                                        type='text'
                                        placeholder='Nhập số tiền'
                                        value={refundAmount}
                                        onChange={(e) =>
                                            handleRefundAmountChange(
                                                e.target.value
                                            )
                                        }
                                        className='flex-1'
                                    />
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={handleFullRefund}
                                        className='whitespace-nowrap'
                                    >
                                        Hoàn toàn bộ
                                    </Button>
                                </div>
                                <p className='text-xs text-gray-500'>
                                    Tối đa: {formatPrice(maxRefundAmount)}
                                </p>
                            </div>

                            {/* Refund Reason */}
                            <div className='space-y-1.5'>
                                <Label className='text-gray-400 text-sm'>
                                    Lý do hoàn tiền (tùy chọn)
                                </Label>
                                <Textarea
                                    placeholder='Nhập lý do hoàn tiền...'
                                    value={refundReason}
                                    onChange={(e) =>
                                        setRefundReason(e.target.value)
                                    }
                                    className='bg-[#1F1F1F] border-[#2D2D2D] text-white min-h-[80px]'
                                    rows={3}
                                />
                            </div>

                            {/* Warning */}
                            <div className='p-2.5 bg-yellow-600/20 border border-yellow-600/50 rounded-lg'>
                                <p className='text-xs text-yellow-300'>
                                    <strong className='text-yellow-400'>
                                        Lưu ý:
                                    </strong>{' '}
                                    Hành động này sẽ hoàn tiền cho khách hàng và
                                    có thể ảnh hưởng đến doanh thu. Vui lòng xác
                                    nhận kỹ trước khi thực hiện.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className='shrink-0 border-t border-[#2D2D2D] pt-4 mt-4'>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsRefundDialogOpen(false)
                                setRefundAmount('')
                                setRefundReason('')
                            }}
                            disabled={actionLoading}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={onConfirmRefund}
                            disabled={
                                actionLoading ||
                                !refundAmount ||
                                parseFloat(refundAmount) <= 0 ||
                                parseFloat(refundAmount) > maxRefundAmount
                            }
                            className='bg-orange-600 hover:bg-orange-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className='h-4 w-4 mr-2' />
                                    Xác nhận hoàn tiền
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
