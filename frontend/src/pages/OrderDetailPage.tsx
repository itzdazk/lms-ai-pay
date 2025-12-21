import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { OrderSummary } from '../components/Payment/OrderSummary'
import { TransactionList } from '../components/Payment/TransactionList'
import { useOrderById, useCancelOrder } from '../hooks/useOrders'
import { formatPrice } from '../lib/courseUtils'
import { formatDateTime } from '../lib/utils'
import {
    ArrowLeft,
    X,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    CreditCard,
    Wallet,
    MapPin,
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
} from 'lucide-react'

function getStatusBadge(status: string) {
    switch (status) {
        case 'PAID':
            return (
                <Badge className='bg-green-100 text-green-700 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40 flex items-center gap-1.5'>
                    <CheckCircle className='h-3 w-3' />
                    Đã thanh toán
                </Badge>
            )
        case 'PENDING':
            return (
                <Badge className='bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-300 dark:border-yellow-500/40 flex items-center gap-1.5'>
                    <Clock className='h-3 w-3' />
                    Đang chờ
                </Badge>
            )
        case 'FAILED':
            return (
                <Badge className='bg-red-100 text-red-700 border border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:border-red-500/40 flex items-center gap-1.5'>
                    <XCircle className='h-3 w-3' />
                    Thất bại
                </Badge>
            )
        case 'REFUNDED':
            return (
                <Badge className='bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Đã hoàn tiền
                </Badge>
            )
        case 'PARTIALLY_REFUNDED':
            return (
                <Badge className='bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-600/20 dark:text-orange-300 dark:border-orange-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Hoàn tiền một phần
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500/40'>
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

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const orderId = id ? parseInt(id, 10) : undefined

    // Cancel order dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

    // Hooks
    const { order, isLoading, refetch } = useOrderById(orderId)
    const { cancelOrder, isLoading: cancelLoading } = useCancelOrder()

    // Handle cancel order
    const handleCancelClick = useCallback(() => {
        setCancelDialogOpen(true)
    }, [])

    const handleCancelConfirm = useCallback(async () => {
        if (!orderId) return

        try {
            await cancelOrder(orderId)
            setCancelDialogOpen(false)
            refetch() // Refresh order data
        } catch (error) {
            // Error is already handled in the hook
        }
    }, [orderId, cancelOrder, refetch])

    // Loading state
    if (isLoading) {
        return (
            <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
                <div className='mb-6'>
                    <Skeleton className='h-8 w-48 mb-2' />
                    <Skeleton className='h-4 w-64' />
                </div>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2'>
                        <Card>
                            <CardHeader>
                                <Skeleton className='h-6 w-32' />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='h-64 w-full' />
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Skeleton className='h-96 w-full' />
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (!order) {
        return (
            <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
                <div className='text-center py-12'>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                        Không tìm thấy đơn hàng
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400 mb-6'>
                        Đơn hàng không tồn tại hoặc bạn không có quyền xem.
                    </p>
                    <DarkOutlineButton asChild>
                        <Link to='/orders'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Quay lại lịch sử đơn hàng
                        </Link>
                    </DarkOutlineButton>
                </div>
            </div>
        )
    }

    const transactions = order.paymentTransactions || []
    const course = order.course

    return (
        <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
            {/* Header */}
            <div className='mb-6'>
                <DarkOutlineButton asChild variant='ghost' className='mb-4'>
                    <Link to='/orders'>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Quay lại lịch sử đơn hàng
                    </Link>
                </DarkOutlineButton>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                            Chi tiết đơn hàng
                        </h1>
                        <p className='text-gray-600 dark:text-gray-400'>
                            Mã đơn:{' '}
                            <span className='font-mono'>{order.orderCode}</span>
                        </p>
                    </div>
                    {order.paymentStatus === 'PENDING' && (
                        <Button
                            variant='outline'
                            className='border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                            onClick={handleCancelClick}
                            disabled={cancelLoading}
                        >
                            {cancelLoading ? (
                                <>
                                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2' />
                                    Đang hủy...
                                </>
                            ) : (
                                <>
                                    <X className='mr-2 h-4 w-4' />
                                    Hủy đơn hàng
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Main Content */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Order Info */}
                    <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-gray-900 dark:text-white'>
                                Thông tin đơn hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Trạng thái
                                    </p>
                                    <div>
                                        {getStatusBadge(order.paymentStatus)}
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Phương thức thanh toán
                                    </p>
                                    <Badge
                                        variant='outline'
                                        className='border-gray-300 text-gray-700 dark:border-[#2D2D2D] dark:text-gray-300 flex items-center gap-1.5 w-fit'
                                    >
                                        {getGatewayIcon(order.paymentGateway)}
                                        {order.paymentGateway}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Ngày tạo
                                    </p>
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-1.5'>
                                        <Calendar className='h-4 w-4' />
                                        {formatDateTime(order.createdAt)}
                                    </p>
                                </div>
                                {order.paidAt && (
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                            Ngày thanh toán
                                        </p>
                                        <p className='text-sm text-gray-900 dark:text-white flex items-center gap-1.5'>
                                            <Calendar className='h-4 w-4' />
                                            {formatDateTime(order.paidAt)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />

                            <div className='space-y-2'>
                                <div className='flex justify-between text-gray-600 dark:text-gray-400'>
                                    <span>Giá gốc:</span>
                                    <span>
                                        {formatPrice(order.originalPrice)}
                                    </span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className='flex justify-between text-green-500'>
                                        <span>Giảm giá:</span>
                                        <span>
                                            -{formatPrice(order.discountAmount)}
                                        </span>
                                    </div>
                                )}
                                <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                <div className='flex justify-between items-center'>
                                    <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                                        Tổng cộng:
                                    </span>
                                    <span className='text-xl font-bold text-blue-600 dark:text-blue-500'>
                                        {formatPrice(order.finalPrice)}
                                    </span>
                                </div>
                            </div>

                            {order.refundAmount > 0 && (
                                <>
                                    <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                    <div className='flex justify-between text-purple-500'>
                                        <span>Đã hoàn tiền:</span>
                                        <span className='font-semibold'>
                                            {formatPrice(order.refundAmount)}
                                        </span>
                                    </div>
                                    {order.refundedAt && (
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                            Ngày hoàn tiền:{' '}
                                            {formatDateTime(order.refundedAt)}
                                        </p>
                                    )}
                                </>
                            )}

                            {order.notes && (
                                <>
                                    <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5'>
                                            <FileText className='h-4 w-4' />
                                            Ghi chú
                                        </p>
                                        <p className='text-sm text-gray-900 dark:text-white'>
                                            {order.notes}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Billing Address */}
                    {order.billingAddress && (
                        <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-gray-900 dark:text-white flex items-center gap-2'>
                                    <MapPin className='h-5 w-5' />
                                    Địa chỉ thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-2'>
                                {order.billingAddress.fullName && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <User className='h-4 w-4 text-gray-500' />
                                        {order.billingAddress.fullName}
                                    </p>
                                )}
                                {order.billingAddress.email && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <Mail className='h-4 w-4 text-gray-500' />
                                        {order.billingAddress.email}
                                    </p>
                                )}
                                {order.billingAddress.phone && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <Phone className='h-4 w-4 text-gray-500' />
                                        {order.billingAddress.phone}
                                    </p>
                                )}
                                {order.billingAddress.address && (
                                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                                        {order.billingAddress.address}
                                        {order.billingAddress.city &&
                                            `, ${order.billingAddress.city}`}
                                        {order.billingAddress.country &&
                                            `, ${order.billingAddress.country}`}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Transactions */}
                    <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-gray-900 dark:text-white'>
                                Lịch sử giao dịch
                            </CardTitle>
                            <CardDescription className='text-gray-600 dark:text-gray-400'>
                                {transactions.length > 0
                                    ? `${transactions.length} giao dịch`
                                    : 'Chưa có giao dịch nào'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionList
                                transactions={transactions}
                                loading={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className='space-y-6'>
                    {/* Order Summary */}
                    <OrderSummary course={course || null} loading={false} />

                    {/* Actions */}
                    {course && (
                        <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-gray-900 dark:text-white'>
                                    Thao tác
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                                {order.paymentStatus === 'PAID' && course && (
                                    <DarkOutlineButton
                                        asChild
                                        className='w-full'
                                    >
                                        <Link
                                            to={`/courses/${
                                                course.slug || course.id
                                            }`}
                                        >
                                            Vào học ngay
                                        </Link>
                                    </DarkOutlineButton>
                                )}
                                {order.paymentStatus === 'FAILED' && course && (
                                    <DarkOutlineButton
                                        asChild
                                        className='w-full'
                                    >
                                        <Link to={`/checkout/${course.id}`}>
                                            Thử lại thanh toán
                                        </Link>
                                    </DarkOutlineButton>
                                )}
                                <DarkOutlineButton
                                    asChild
                                    variant='outline'
                                    className='w-full'
                                >
                                    <Link to='/orders'>
                                        Xem tất cả đơn hàng
                                    </Link>
                                </DarkOutlineButton>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D] text-gray-900 dark:text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                        <DialogDescription className='text-gray-600 dark:text-gray-400'>
                            Bạn có chắc chắn muốn hủy đơn hàng{' '}
                            <span className='font-mono font-semibold'>
                                {order.orderCode}
                            </span>
                            ? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setCancelDialogOpen(false)}
                            className='border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            disabled={cancelLoading}
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
