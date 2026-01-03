import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { Skeleton } from '../../ui/skeleton'
import { formatPrice } from '../../../lib/courseUtils'
import { formatDateTime } from '../../../lib/utils'
import { adminOrdersApi } from '../../../lib/api/admin-orders'
import type { RefundRequest } from '../../../lib/api/refund-requests'
import type { Course, Order } from '../../../lib/api/types'
import {
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    CreditCard,
    Wallet,
    User,
    Mail,
    Phone,
    Receipt,
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

interface OrderDetailsDialogProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    refundRequest: RefundRequest | null
}

export function OrderDetailsDialog({
    isOpen,
    setIsOpen,
    refundRequest,
}: OrderDetailsDialogProps) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen && refundRequest?.order?.id) {
            const fetchOrderDetails = async () => {
                try {
                    setIsLoading(true)
                    const orderData = await adminOrdersApi.getOrderById(
                        refundRequest.order!.id
                    )
                    setOrder(orderData)
                } catch (error: any) {
                    console.error('Error fetching order details:', error)
                    // Fallback to order from refundRequest if fetch fails
                    setOrder(refundRequest.order as Order)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchOrderDetails()
        } else if (refundRequest?.order) {
            // Use order from refundRequest if dialog is closed or no orderId
            setOrder(refundRequest.order as Order)
        }
    }, [isOpen, refundRequest?.order?.id])

    if (!refundRequest || !refundRequest.order) {
        return null
    }

    // Use fetched order or fallback to refundRequest.order
    const displayOrder = order || (refundRequest.order as Order)
    const course = displayOrder.course as Course | undefined
    const user = displayOrder.user || refundRequest.student

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                wide
                className='bg-[#1A1A1A] border-[#2D2D2D] text-white !max-w-[60vw] !w-[60vw] max-h-[90vh] overflow-y-auto'
            >
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>
                        Chi tiết đơn hàng
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Mã đơn hàng: {displayOrder.orderCode}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className='space-y-4 mt-4'>
                        <Skeleton className='h-32 w-full' />
                        <Skeleton className='h-64 w-full' />
                        <Skeleton className='h-48 w-full' />
                    </div>
                ) : (
                    <div className='space-y-6 mt-4'>
                        {/* Customer Info */}
                        {user && (
                            <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                                <CardHeader>
                                    <CardTitle className='text-white text-lg flex items-center gap-2'>
                                        <User className='h-5 w-5' />
                                        Thông tin khách hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-3'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                                <User className='h-4 w-4' />
                                                Họ và tên
                                            </p>
                                            <p className='text-sm text-white font-medium'>
                                                {user.fullName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                                <Mail className='h-4 w-4' />
                                                Email
                                            </p>
                                            <p className='text-sm text-white font-medium'>
                                                {user.email}
                                            </p>
                                        </div>
                                        {displayOrder.billingAddress?.phone && (
                                            <div>
                                                <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                                    <Phone className='h-4 w-4' />
                                                    Số điện thoại
                                                </p>
                                                <p className='text-sm text-white font-medium'>
                                                    {
                                                        displayOrder
                                                            .billingAddress
                                                            .phone
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Order Info */}
                        <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-white text-lg flex items-center gap-2'>
                                    <Receipt className='h-5 w-5' />
                                    Thông tin đơn hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1'>
                                            Trạng thái
                                        </p>
                                        <div>
                                            {getStatusBadge(
                                                displayOrder.paymentStatus ||
                                                    'PENDING'
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
                                                displayOrder.paymentGateway ||
                                                    'VNPay'
                                            )}
                                            {displayOrder.paymentGateway ||
                                                'VNPay'}
                                        </Badge>
                                    </div>
                                    {displayOrder.transactionId && (
                                        <div className='md:col-span-2'>
                                            <p className='text-sm text-gray-400 mb-1'>
                                                Transaction ID
                                            </p>
                                            <p className='text-sm text-white font-mono break-all'>
                                                {displayOrder.transactionId}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className='text-sm text-gray-400 mb-1'>
                                            Ngày tạo
                                        </p>
                                        <p className='text-sm text-white flex items-center gap-1.5'>
                                            <Calendar className='h-4 w-4' />
                                            {formatDateTime(
                                                displayOrder.createdAt
                                            )}
                                        </p>
                                    </div>
                                    {displayOrder.paidAt && (
                                        <div>
                                            <p className='text-sm text-gray-400 mb-1'>
                                                Ngày thanh toán
                                            </p>
                                            <p className='text-sm text-white flex items-center gap-1.5'>
                                                <Calendar className='h-4 w-4' />
                                                {formatDateTime(
                                                    displayOrder.paidAt
                                                )}
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
                                                displayOrder.originalPrice ||
                                                    displayOrder.finalPrice
                                            )}
                                        </span>
                                    </div>
                                    {displayOrder.discountAmount > 0 && (
                                        <div className='flex justify-between text-green-400'>
                                            <span>Giảm giá:</span>
                                            <span>
                                                -
                                                {formatPrice(
                                                    displayOrder.discountAmount
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <Separator className='bg-[#2D2D2D]' />
                                    <div className='flex justify-between items-center'>
                                        <span className='text-lg font-semibold text-white'>
                                            Tổng cộng:
                                        </span>
                                        <span className='text-xl font-bold text-blue-400'>
                                            {formatPrice(
                                                displayOrder.finalPrice
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {displayOrder.refundAmount &&
                                    displayOrder.refundAmount > 0 && (
                                        <>
                                            <Separator className='bg-[#2D2D2D]' />
                                            <div className='flex justify-between text-purple-400'>
                                                <span>Đã hoàn tiền:</span>
                                                <span className='font-semibold'>
                                                    {formatPrice(
                                                        displayOrder.refundAmount
                                                    )}
                                                </span>
                                            </div>
                                            {displayOrder.refundedAt && (
                                                <p className='text-xs text-gray-500'>
                                                    Ngày hoàn tiền:{' '}
                                                    {formatDateTime(
                                                        displayOrder.refundedAt
                                                    )}
                                                </p>
                                            )}
                                        </>
                                    )}

                                {displayOrder.notes && (
                                    <>
                                        <Separator className='bg-[#2D2D2D]' />
                                        <div>
                                            <p className='text-sm text-gray-400 mb-1 flex items-center gap-1.5'>
                                                <FileText className='h-4 w-4' />
                                                Ghi chú
                                            </p>
                                            <p className='text-sm text-white'>
                                                {displayOrder.notes}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Course Details - Only course info, no pricing */}
                        {course && (
                            <Card className='bg-[#1F1F1F] border-[#2D2D2D]'>
                                <CardHeader>
                                    <CardTitle className='text-white text-lg'>
                                        Thông tin khóa học
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    {(course.thumbnailUrl ||
                                        (course as any).thumbnail) && (
                                        <img
                                            src={
                                                course.thumbnailUrl ||
                                                (course as any).thumbnail
                                            }
                                            alt={course.title}
                                            className='w-full h-48 object-cover rounded-lg'
                                        />
                                    )}
                                    <div>
                                        <h3 className='font-semibold text-lg mb-2 text-white'>
                                            {course.title}
                                        </h3>
                                        {course.instructor?.fullName && (
                                            <p className='text-sm text-gray-400 mb-4'>
                                                Giảng viên:{' '}
                                                {course.instructor.fullName}
                                            </p>
                                        )}
                                        {course.description && (
                                            <p className='text-sm text-gray-300 line-clamp-3'>
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
