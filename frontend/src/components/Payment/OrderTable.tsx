import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../ui/dark-outline-table'
import { Skeleton } from '../ui/skeleton'
import type { Order } from '../../lib/api/types'
import { formatPrice } from '../../lib/courseUtils'
import { formatDateTime } from '../../lib/utils'
import { Eye, X } from 'lucide-react'

type OrderTableProps = {
    orders: Order[]
    loading?: boolean
    onCancel?: (orderId: number) => void
    cancelLoading?: number | null
}

function getStatusBadge(status: Order['paymentStatus']) {
    switch (status) {
        case 'PAID':
            return (
                <Badge className='bg-green-600/20 text-green-300 border border-green-500/40'>
                    Đã thanh toán
                </Badge>
            )
        case 'PENDING':
            return (
                <Badge className='bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'>
                    Đang chờ
                </Badge>
            )
        case 'FAILED':
            return (
                <Badge className='bg-red-600/20 text-red-300 border border-red-500/40'>
                    Thất bại
                </Badge>
            )
        case 'REFUNDED':
            return (
                <Badge className='bg-purple-600/20 text-purple-300 border border-purple-500/40'>
                    Đã hoàn tiền
                </Badge>
            )
        case 'PARTIALLY_REFUNDED':
            return (
                <Badge className='bg-orange-600/20 text-orange-300 border border-orange-500/40'>
                    Hoàn tiền một phần
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

function getGatewayBadge(gateway: Order['paymentGateway']) {
    return (
        <Badge
            variant='outline'
            className='border-[#2D2D2D] text-gray-300 text-xs'
        >
            {gateway}
        </Badge>
    )
}

export function OrderTable({
    orders,
    loading,
    onCancel,
    cancelLoading,
}: OrderTableProps) {
    // Cancel order dialog state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<{
        id: number
        orderCode: string
    } | null>(null)

    // Handle cancel click - open dialog
    const handleCancelClick = useCallback(
        (orderId: number, orderCode: string) => {
            setOrderToCancel({ id: orderId, orderCode })
            setCancelDialogOpen(true)
        },
        []
    )

    // Handle cancel confirm
    const handleCancelConfirm = useCallback(async () => {
        if (!orderToCancel || !onCancel) return

        try {
            await onCancel(orderToCancel.id)
            setCancelDialogOpen(false)
            setOrderToCancel(null)
        } catch (error) {
            // Error is already handled in the parent
            // Keep dialog open so user can retry
        }
    }, [orderToCancel, onCancel])

    if (loading) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
                <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                        <DarkOutlineTableRow>
                            <DarkOutlineTableHead>Mã đơn</DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Khóa học
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Trạng thái
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Phương thức
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Tổng tiền
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Ngày tạo
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Thao tác
                            </DarkOutlineTableHead>
                        </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <DarkOutlineTableRow key={i}>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-24' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-32' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-6 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-6 w-16' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-28' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-8 w-20' />
                                </DarkOutlineTableCell>
                            </DarkOutlineTableRow>
                        ))}
                    </DarkOutlineTableBody>
                </DarkOutlineTable>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] bg-[#1A1A1A] p-12 text-center'>
                <p className='text-gray-400 text-lg'>Chưa có đơn hàng nào</p>
                <p className='text-gray-500 text-sm mt-2'>
                    Các đơn hàng của bạn sẽ hiển thị ở đây
                </p>
            </div>
        )
    }

    return (
        <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
            <DarkOutlineTable>
                <DarkOutlineTableHeader>
                    <DarkOutlineTableRow>
                        <DarkOutlineTableHead>Mã đơn</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Khóa học</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Phương thức</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Tổng tiền</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Thao tác</DarkOutlineTableHead>
                    </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                    {orders.map((order) => (
                        <DarkOutlineTableRow key={order.id}>
                            <DarkOutlineTableCell className='font-mono text-sm'>
                                {order.orderCode}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                <div className='max-w-xs'>
                                    <p className='text-white font-medium line-clamp-1'>
                                        {order.course?.title || 'N/A'}
                                    </p>
                                    {order.course?.instructor?.fullName && (
                                        <p className='text-xs text-gray-400 mt-1'>
                                            {order.course.instructor.fullName}
                                        </p>
                                    )}
                                </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                {getStatusBadge(order.paymentStatus)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                {getGatewayBadge(order.paymentGateway)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='font-semibold text-white'>
                                {formatPrice(order.finalPrice)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-sm text-gray-400'>
                                {formatDateTime(order.createdAt)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                <div className='flex items-center gap-2'>
                                    <DarkOutlineButton
                                        size='sm'
                                        asChild
                                        className='h-8'
                                    >
                                        <Link to={`/orders/${order.id}`}>
                                            <Eye className='h-3 w-3 mr-1' />
                                            Xem
                                        </Link>
                                    </DarkOutlineButton>
                                    {order.paymentStatus === 'PENDING' &&
                                        onCancel && (
                                            <Button
                                                size='sm'
                                                variant='outline'
                                                className='h-8 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                                                onClick={() =>
                                                    handleCancelClick(
                                                        order.id,
                                                        order.orderCode
                                                    )
                                                }
                                                disabled={
                                                    cancelLoading === order.id
                                                }
                                            >
                                                {cancelLoading === order.id ? (
                                                    <>
                                                        <div className='animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent mr-1' />
                                                        Đang hủy...
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className='h-3 w-3 mr-1' />
                                                        Hủy
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                </div>
                            </DarkOutlineTableCell>
                        </DarkOutlineTableRow>
                    ))}
                </DarkOutlineTableBody>
            </DarkOutlineTable>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Bạn có chắc chắn muốn hủy đơn hàng{' '}
                            <span className='font-mono font-semibold'>
                                {orderToCancel?.orderCode}
                            </span>
                            ? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setCancelDialogOpen(false)}
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F]'
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            disabled={
                                cancelLoading === orderToCancel?.id ||
                                !orderToCancel
                            }
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            {cancelLoading === orderToCancel?.id
                                ? 'Đang xử lý...'
                                : 'Xác nhận hủy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
