import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { RefundRequestDialog } from './RefundRequestDialog'
import { refundRequestsApi } from '../../lib/api/refund-requests'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
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
    showActions?: boolean
    onRefundRequestCreated?: () => void
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
    showActions = true,
    onRefundRequestCreated,
}: OrderTableProps) {
    // Cancel order dialog state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<{
        id: number
        orderCode: string
    } | null>(null)

    // Refund request dialog state
    const [refundDialogOpen, setRefundDialogOpen] = useState(false)
    const [orderForRefund, setOrderForRefund] = useState<Order | null>(null)
    const [refundRequestLoading, setRefundRequestLoading] = useState(false)
    const [ordersWithRefundRequests, setOrdersWithRefundRequests] = useState<
        Set<number>
    >(new Set())

    // Check refund requests for PAID orders
    useEffect(() => {
        const checkRefundRequests = async () => {
            const paidOrders = orders.filter(
                (order) => order.paymentStatus === 'PAID'
            )

            if (paidOrders.length === 0) return

            try {
                const requests = await Promise.all(
                    paidOrders.map((order) =>
                        refundRequestsApi
                            .getRefundRequestByOrderId(order.id)
                            .then((req) => ({
                                orderId: order.id,
                                request: req,
                            }))
                            .catch(() => ({
                                orderId: order.id,
                                request: null,
                            }))
                    )
                )

                const orderIdsWithRequests = new Set<number>()
                requests.forEach(({ orderId, request }) => {
                    if (
                        request &&
                        (request.status === 'PENDING' ||
                            request.status === 'APPROVED')
                    ) {
                        orderIdsWithRequests.add(orderId)
                    }
                })

                setOrdersWithRefundRequests(orderIdsWithRequests)
            } catch (error) {
                console.error('Error checking refund requests:', error)
            }
        }

        if (!loading && orders.length > 0) {
            checkRefundRequests()
        }
    }, [orders, loading])

    // Handle refund request click
    const handleRefundRequestClick = useCallback((order: Order) => {
        setOrderForRefund(order)
        setRefundDialogOpen(true)
    }, [])

    // Handle refund request submit
    const handleRefundRequestSubmit = useCallback(
        async (reason: string) => {
            if (!orderForRefund) return

            try {
                setRefundRequestLoading(true)
                const refundRequest =
                    await refundRequestsApi.createRefundRequest({
                        orderId: orderForRefund.id,
                        reason,
                    })

                if (refundRequest.status === 'REJECTED') {
                    toast.warning(
                        refundRequest.adminNotes ||
                            'Yêu cầu hoàn tiền đã bị từ chối tự động do tiến độ khóa học >= 50%'
                    )
                } else {
                    toast.success(
                        'Yêu cầu hoàn tiền đã được gửi thành công. Quản trị viên sẽ xem xét yêu cầu của bạn.'
                    )
                    // Add to set of orders with refund requests
                    setOrdersWithRefundRequests((prev) => {
                        const next = new Set(prev)
                        next.add(orderForRefund.id)
                        return next
                    })
                }

                setRefundDialogOpen(false)
                setOrderForRefund(null)

                // Call callback if provided
                if (onRefundRequestCreated) {
                    onRefundRequestCreated()
                }
            } catch (error: any) {
                console.error('Error creating refund request:', error)
                toast.error(
                    error.response?.data?.message ||
                        error.message ||
                        'Không thể gửi yêu cầu hoàn tiền'
                )
                throw error
            } finally {
                setRefundRequestLoading(false)
            }
        },
        [orderForRefund, onRefundRequestCreated]
    )

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
                                Học viên
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
                            {showActions && (
                                <DarkOutlineTableHead>
                                    Thao tác
                                </DarkOutlineTableHead>
                            )}
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
                                {showActions && (
                                    <DarkOutlineTableCell>
                                        <Skeleton className='h-8 w-20' />
                                    </DarkOutlineTableCell>
                                )}
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
                        <DarkOutlineTableHead>Học viên</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Phương thức</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Tổng tiền</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                        {showActions && (
                            <DarkOutlineTableHead>
                                Thao tác
                            </DarkOutlineTableHead>
                        )}
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
                                <div className='max-w-xs'>
                                    {order.user ? (
                                        <>
                                            <p className='text-white font-medium line-clamp-1'>
                                                {order.user.fullName || 'N/A'}
                                            </p>
                                            {order.user.email && (
                                                <p className='text-xs text-gray-400 mt-1 line-clamp-1'>
                                                    {order.user.email}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <span className='text-gray-400'>
                                            N/A
                                        </span>
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
                            {showActions && (
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
                                        {order.paymentStatus === 'PAID' &&
                                            !ordersWithRefundRequests.has(
                                                order.id
                                            ) && (
                                                <Button
                                                    size='sm'
                                                    variant='outline'
                                                    className='h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                                                    onClick={() =>
                                                        handleRefundRequestClick(
                                                            order
                                                        )
                                                    }
                                                >
                                                    <RotateCcw className='h-3 w-3 mr-1' />
                                                    Yêu cầu hoàn tiền
                                                </Button>
                                            )}
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
                                                        cancelLoading ===
                                                        order.id
                                                    }
                                                >
                                                    {cancelLoading ===
                                                    order.id ? (
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
                            )}
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

            {/* Refund Request Dialog */}
            <RefundRequestDialog
                isOpen={refundDialogOpen}
                setIsOpen={setRefundDialogOpen}
                order={orderForRefund}
                onSubmit={handleRefundRequestSubmit}
                loading={refundRequestLoading}
            />
        </div>
    )
}
