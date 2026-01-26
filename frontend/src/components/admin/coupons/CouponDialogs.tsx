import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { CouponForm } from './CouponForm'
import { CouponUsageHistory } from './CouponUsageHistory'
import type { Coupon } from '../../../lib/api/types'

interface CouponDialogsProps {
    // Form Dialog
    isFormOpen: boolean
    editingCoupon: Coupon | null
    onFormClose: () => void
    onFormSuccess: () => void

    // Usage History Dialog
    isUsageHistoryOpen: boolean
    selectedCouponId: number | null
    onUsageHistoryClose: () => void

    // Delete Dialog
    isDeleteOpen: boolean
    onDeleteClose: () => void
    onConfirmDelete: () => void
}

export function CouponDialogs({
    isFormOpen,
    editingCoupon,
    onFormClose,
    onFormSuccess,
    isUsageHistoryOpen,
    selectedCouponId,
    onUsageHistoryClose,
    isDeleteOpen,
    onDeleteClose,
    onConfirmDelete,
}: CouponDialogsProps) {
    return (
        <>
            {/* Coupon Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={onFormClose}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCoupon ? 'Chỉnh sửa mã' : 'Tạo mã mới'}
                        </DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            {editingCoupon
                                ? 'Cập nhật thông tin mã giảm giá'
                                : 'Tạo mã giảm giá mới cho khóa học'}
                        </DialogDescription>
                    </DialogHeader>
                    <CouponForm
                        coupon={editingCoupon}
                        onSuccess={onFormSuccess}
                        onCancel={onFormClose}
                    />
                </DialogContent>
            </Dialog>

            {/* Usage History Dialog */}
            {selectedCouponId && (
                <Dialog
                    open={isUsageHistoryOpen}
                    onOpenChange={onUsageHistoryClose}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle>Lịch sử sử dụng mã</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Xem chi tiết các lần sử dụng mã giảm giá
                            </DialogDescription>
                        </DialogHeader>
                        <CouponUsageHistory couponId={selectedCouponId} />
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={onDeleteClose}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa mã giảm giá</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Bạn có chắc chắn muốn xóa mã giảm giá này? Nếu mã đã
                            được sử dụng, nó sẽ chỉ bị vô hiệu hóa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='gap-2 sm:gap-2'>
                        <Button
                            variant='outline'
                            onClick={onDeleteClose}
                            className='border-[#2D2D2D] text-white bg-black hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]'
                        >
                            Hủy
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={onConfirmDelete}
                            className='border-[#2D2D2D] bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700'
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
