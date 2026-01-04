import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { RefundRequestDialog } from './RefundRequestDialog'
import { refundRequestsApi } from '../../lib/api/refund-requests'
import { toast } from 'sonner'
import {
    CreditCard,
    RefreshCw,
    RotateCcw,
    Wallet,
    MoreVertical,
    Eye,
    X,
    BookOpen,
} from 'lucide-react'
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
        case 'REFUND_PENDING':
            return (
                <Badge className='bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'>
                    Đang chờ hoàn tiền
                </Badge>
            )
        case 'REFUND_FAILED':
            return (
                <Badge className='bg-red-600/20 text-red-300 border border-red-500/40'>
                    Hoàn tiền thất bại
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
function getGatewayIcon(gateway: Order['paymentGateway']) {
    switch (gateway) {
        case 'VNPay':
            return <CreditCard className='h-4 w-4' />
        case 'MoMo':
            return <Wallet className='h-4 w-4' />
        default:
            return <CreditCard className='h-4 w-4' />
    }
}
function getGatewayBadge(gateway: Order['paymentGateway']) {
    return (
        <Badge
            variant='outline'
            className='border-[#2D2D2D] text-gray-300 text-xs'
        >
            {getGatewayIcon(gateway)}
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
    const navigate = useNavigate()

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
    // Map orderId -> refundRequestId for pending requests
    const [pendingRefundRequestIds, setPendingRefundRequestIds] = useState<
        Map<number, number>
    >(new Map())
    const [cancellingRefundRequestId, setCancellingRefundRequestId] = useState<
        number | null
    >(null)

    // Context menu state
    const [menuOpen, setMenuOpen] = useState<number | null>(null) // orderId when menu is open
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [adjustedPosition, setAdjustedPosition] = useState({
        x: 0,
        y: 0,
        transform: 'translate(-100%, 0)',
    })
    const menuRef = useRef<HTMLDivElement>(null)

    // Check refund requests for PAID and REFUND_PENDING orders
    useEffect(() => {
        const checkRefundRequests = async () => {
            const paidOrders = orders.filter(
                (order) =>
                    order.paymentStatus === 'PAID' ||
                    order.paymentStatus === 'REFUND_PENDING' ||
                    order.paymentStatus === 'REFUND_FAILED'
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
                const pendingRequestIds = new Map<number, number>()

                requests.forEach(({ orderId, request }) => {
                    if (request) {
                        if (
                            request.status === 'PENDING' ||
                            request.status === 'APPROVED'
                        ) {
                            orderIdsWithRequests.add(orderId)
                        }
                        // Store refund request ID for pending requests
                        if (request.status === 'PENDING') {
                            pendingRequestIds.set(orderId, request.id)
                        }
                    }
                })

                // Also add orders with REFUND_PENDING status
                orders.forEach((order) => {
                    if (order.paymentStatus === 'REFUND_PENDING') {
                        orderIdsWithRequests.add(order.id)
                    }
                })

                setOrdersWithRefundRequests(orderIdsWithRequests)
                setPendingRefundRequestIds(pendingRequestIds)
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
        async (
            reason: string,
            reasonType?:
                | 'MEDICAL'
                | 'FINANCIAL_EMERGENCY'
                | 'DISSATISFACTION'
                | 'OTHER'
        ) => {
            if (!orderForRefund) return

            try {
                setRefundRequestLoading(true)
                const refundRequest =
                    await refundRequestsApi.createRefundRequest({
                        orderId: orderForRefund.id,
                        reason: reason,
                        reasonType: reasonType,
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

    // Handle cancel refund request
    const handleCancelRefundRequest = useCallback(
        async (orderId: number) => {
            const refundRequestId = pendingRefundRequestIds.get(orderId)
            if (!refundRequestId) return

            try {
                setCancellingRefundRequestId(refundRequestId)
                await refundRequestsApi.cancelRefundRequest(refundRequestId)
                toast.success('Đã hủy yêu cầu hoàn tiền thành công')

                // Remove from sets
                setOrdersWithRefundRequests((prev) => {
                    const next = new Set(prev)
                    next.delete(orderId)
                    return next
                })
                setPendingRefundRequestIds((prev) => {
                    const next = new Map(prev)
                    next.delete(orderId)
                    return next
                })

                // Call callback if provided
                if (onRefundRequestCreated) {
                    onRefundRequestCreated()
                }
            } catch (error: any) {
                console.error('Error cancelling refund request:', error)
                toast.error(
                    error.response?.data?.message ||
                        error.message ||
                        'Không thể hủy yêu cầu hoàn tiền'
                )
            } finally {
                setCancellingRefundRequestId(null)
            }
        },
        [pendingRefundRequestIds, onRefundRequestCreated]
    )

    // Handle menu toggle
    const handleMenuToggle = useCallback(
        (orderId: number, e: React.MouseEvent) => {
            e.stopPropagation()
            if (menuOpen === orderId) {
                setMenuOpen(null)
            } else {
                setMenuPosition({ x: e.clientX, y: e.clientY })
                setMenuOpen(orderId)
            }
        },
        [menuOpen]
    )

    // Adjust menu position to stay within viewport
    useEffect(() => {
        if (menuOpen === null || !menuRef.current) return

        const menu = menuRef.current
        const menuRect = menu.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let left = menuPosition.x
        let top = menuPosition.y
        let transform = 'translate(-100%, 0)'

        if (left - menuRect.width < 0) {
            transform = 'translate(0, 0)'
            left = menuPosition.x
        }

        if (left + menuRect.width > viewportWidth) {
            transform = 'translate(-100%, 0)'
            left = menuPosition.x
            if (left - menuRect.width < 0) {
                left = viewportWidth - menuRect.width - 8
            }
        }

        if (top + menuRect.height > viewportHeight) {
            top = menuPosition.y - menuRect.height
            if (top < 0) {
                top = 8
            }
        }

        setAdjustedPosition({ x: left, y: top, transform })
    }, [menuOpen, menuPosition])

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(null)
            }
        }

        if (menuOpen !== null) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    if (loading) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
                <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                        <DarkOutlineTableRow>
                            <DarkOutlineTableHead className='w-[140px]'>
                                Mã đơn
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='min-w-[250px]'>
                                Khóa học
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[140px]'>
                                Trạng thái
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[140px]'>
                                Phương thức
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[130px]'>
                                Tổng tiền
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[150px]'>
                                Ngày tạo
                            </DarkOutlineTableHead>
                            {showActions && (
                                <DarkOutlineTableHead className='w-[100px] text-right'>
                                    Thao tác
                                </DarkOutlineTableHead>
                            )}
                        </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <DarkOutlineTableRow key={i}>
                                <DarkOutlineTableCell className='w-[140px]'>
                                    <Skeleton className='h-4 w-24' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='min-w-[250px]'>
                                    <div className='flex items-center gap-3'>
                                        <Skeleton className='h-10 w-16 shrink-0' />
                                        <div className='flex-1'>
                                            <Skeleton className='h-4 w-32 mb-2' />
                                            <Skeleton className='h-3 w-24' />
                                        </div>
                                    </div>
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='w-[140px]'>
                                    <Skeleton className='h-6 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='w-[140px]'>
                                    <Skeleton className='h-6 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='w-[130px]'>
                                    <Skeleton className='h-4 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='w-[150px]'>
                                    <Skeleton className='h-4 w-28' />
                                </DarkOutlineTableCell>
                                {showActions && (
                                    <DarkOutlineTableCell className='w-[100px] text-right'>
                                        <Skeleton className='h-8 w-8 ml-auto' />
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
                        <DarkOutlineTableHead className='w-[250px]'>
                            Mã đơn
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='min-w-[250px]'>
                            Khóa học
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[140px]'>
                            Trạng thái
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[140px]'>
                            Phương thức
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[130px]'>
                            Tổng tiền
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[150px]'>
                            Ngày tạo
                        </DarkOutlineTableHead>
                        {showActions && (
                            <DarkOutlineTableHead className='w-[100px] text-right'>
                                Thao tác
                            </DarkOutlineTableHead>
                        )}
                    </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                    {orders.map((order) => (
                        <DarkOutlineTableRow key={order.id}>
                            <DarkOutlineTableCell className='font-mono text-sm w-[140px]'>
                                {order.orderCode}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='min-w-[250px]'>
                                <div className='flex items-start gap-3'>
                                    {order.course?.thumbnailUrl ? (
                                        <img
                                            src={order.course.thumbnailUrl}
                                            alt={
                                                order.course.title ||
                                                'Course thumbnail'
                                            }
                                            className='w-16 h-10 object-cover rounded shrink-0'
                                        />
                                    ) : (
                                        <div className='w-16 h-10 bg-[#2D2D2D] rounded flex items-center justify-center shrink-0'>
                                            <BookOpen className='h-5 w-5 text-gray-400' />
                                        </div>
                                    )}
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-white font-medium line-clamp-1'>
                                            {order.course?.title || 'N/A'}
                                        </p>
                                        {order.course?.instructor?.fullName && (
                                            <p className='text-xs text-gray-400 mt-1'>
                                                {
                                                    order.course.instructor
                                                        .fullName
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='w-[140px]'>
                                {getStatusBadge(order.paymentStatus)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='w-[140px]'>
                                {getGatewayBadge(order.paymentGateway)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='font-semibold text-white w-[130px]'>
                                {formatPrice(order.finalPrice)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-sm text-gray-400 w-[150px]'>
                                {formatDateTime(order.createdAt)}
                            </DarkOutlineTableCell>
                            {showActions && (
                                <DarkOutlineTableCell className='text-right w-[100px]'>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                                        onClick={(e) =>
                                            handleMenuToggle(order.id, e)
                                        }
                                    >
                                        <MoreVertical className='h-4 w-4' />
                                    </Button>
                                </DarkOutlineTableCell>
                            )}
                        </DarkOutlineTableRow>
                    ))}
                </DarkOutlineTableBody>
            </DarkOutlineTable>

            {/* Context Menu */}
            {menuOpen !== null && (
                <div
                    ref={menuRef}
                    className='fixed z-50 min-w-40 rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md'
                    style={{
                        left: `${adjustedPosition.x}px`,
                        top: `${adjustedPosition.y}px`,
                        transform: adjustedPosition.transform,
                    }}
                >
                    {(() => {
                        const order = orders.find((o) => o.id === menuOpen)
                        if (!order) return null

                        const hasPendingRefundRequest =
                            ordersWithRefundRequests.has(order.id) &&
                            pendingRefundRequestIds.has(order.id)
                        const canRequestRefund =
                            (order.paymentStatus === 'PAID' ||
                                order.paymentStatus === 'REFUND_FAILED') &&
                            !ordersWithRefundRequests.has(order.id)
                        const canRetryPayment =
                            order.paymentStatus === 'FAILED' &&
                            order.course?.slug
                        const canCancel =
                            order.paymentStatus === 'PENDING' && onCancel
                        const isCancellingRefund =
                            hasPendingRefundRequest &&
                            cancellingRefundRequestId ===
                                pendingRefundRequestIds.get(order.id)
                        const isCancellingOrder =
                            canCancel && cancelLoading === order.id

                        return (
                            <>
                                {/* View Order - Always available */}
                                <div
                                    className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                                    onClick={() => {
                                        navigate(`/orders/${order.id}`)
                                        setMenuOpen(null)
                                    }}
                                >
                                    <Eye className='h-4 w-4' />
                                    Xem chi tiết
                                </div>

                                {/* Refund Request - For PAID/REFUND_FAILED orders without existing request */}
                                {canRequestRefund && (
                                    <div
                                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-blue-400 hover:bg-[#1F1F1F] cursor-pointer'
                                        onClick={() => {
                                            handleRefundRequestClick(order)
                                            setMenuOpen(null)
                                        }}
                                    >
                                        <RotateCcw className='h-4 w-4' />
                                        Hoàn tiền
                                    </div>
                                )}

                                {/* Cancel Refund Request - For orders with pending refund request */}
                                {hasPendingRefundRequest && (
                                    <div
                                        className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-orange-400 hover:bg-[#1F1F1F] ${
                                            isCancellingRefund
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer'
                                        }`}
                                        onClick={() => {
                                            if (!isCancellingRefund) {
                                                handleCancelRefundRequest(
                                                    order.id
                                                )
                                                setMenuOpen(null)
                                            }
                                        }}
                                    >
                                        {isCancellingRefund ? (
                                            <>
                                                <div className='animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent' />
                                                Đang hủy...
                                            </>
                                        ) : (
                                            <>
                                                <X className='h-4 w-4' />
                                                Hủy hoàn tiền
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Retry Payment - For FAILED orders */}
                                {canRetryPayment && (
                                    <div
                                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                                        onClick={() => {
                                            navigate(
                                                `/checkout/${
                                                    order.course!.slug
                                                }`
                                            )
                                            setMenuOpen(null)
                                        }}
                                    >
                                        <RefreshCw className='h-4 w-4' />
                                        Thanh toán lại
                                    </div>
                                )}

                                {/* Cancel Order - For PENDING orders */}
                                {canCancel && (
                                    <div
                                        className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-[#1F1F1F] ${
                                            isCancellingOrder
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer'
                                        }`}
                                        onClick={() => {
                                            if (!isCancellingOrder) {
                                                handleCancelClick(
                                                    order.id,
                                                    order.orderCode
                                                )
                                                setMenuOpen(null)
                                            }
                                        }}
                                    >
                                        {isCancellingOrder ? (
                                            <>
                                                <div className='animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent' />
                                                Đang hủy...
                                            </>
                                        ) : (
                                            <>
                                                <X className='h-4 w-4' />
                                                Hủy đơn hàng
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}

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
