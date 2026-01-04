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
import { formatPrice, formatDuration } from '../../../lib/courseUtils'
import { formatDateTime } from '../../../lib/utils'
import { adminOrdersApi } from '../../../lib/api/admin-orders'
import type { RefundRequest } from '../../../lib/api/refund-requests'
import type { Course, Order } from '../../../lib/api/types'
import { Link } from 'react-router-dom'
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
    MapPin,
    BookOpen,
    Sparkles,
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
                className='bg-[#1A1A1A] border-[#2D2D2D] text-white !max-w-[80vw] !w-[80vw] max-h-[90vh] overflow-y-auto'
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
                        {user && (
                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                                <div className='lg:col-span-2 space-y-6'>
                                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                        <CardHeader>
                                            <CardTitle className='text-white text-lg flex items-center gap-2'>
                                                <Receipt className='h-5 w-5' />
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
                                                            displayOrder.paymentStatus
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
                                                            displayOrder.paymentGateway
                                                        )}
                                                        {
                                                            displayOrder.paymentGateway
                                                        }
                                                    </Badge>
                                                </div>
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
                                                            displayOrder.originalPrice
                                                        )}
                                                    </span>
                                                </div>
                                                {displayOrder.discountAmount >
                                                    0 && (
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

                                            {displayOrder.refundAmount > 0 && (
                                                <>
                                                    <Separator className='bg-[#2D2D2D]' />
                                                    <div className='flex justify-between text-purple-400'>
                                                        <span>
                                                            Đã hoàn tiền:
                                                        </span>
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
                                    {displayOrder.billingAddress && (
                                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                            <CardHeader>
                                                <CardTitle className='text-white flex items-center gap-2'>
                                                    <MapPin className='h-5 w-5' />
                                                    Địa chỉ thanh toán
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className='space-y-2'>
                                                {displayOrder.billingAddress
                                                    .fullName && (
                                                    <p className='text-sm text-white flex items-center gap-2'>
                                                        <User className='h-4 w-4 text-gray-500' />
                                                        {
                                                            displayOrder
                                                                .billingAddress
                                                                .fullName
                                                        }
                                                    </p>
                                                )}
                                                {displayOrder.billingAddress
                                                    .email && (
                                                    <p className='text-sm text-white flex items-center gap-2'>
                                                        <Mail className='h-4 w-4 text-gray-500' />
                                                        {
                                                            displayOrder
                                                                .billingAddress
                                                                .email
                                                        }
                                                    </p>
                                                )}
                                                {displayOrder.billingAddress
                                                    .phone && (
                                                    <p className='text-sm text-white flex items-center gap-2'>
                                                        <Phone className='h-4 w-4 text-gray-500' />
                                                        {
                                                            displayOrder
                                                                .billingAddress
                                                                .phone
                                                        }
                                                    </p>
                                                )}
                                                {displayOrder.billingAddress
                                                    .address && (
                                                    <p className='text-sm text-gray-400'>
                                                        {
                                                            displayOrder
                                                                .billingAddress
                                                                .address
                                                        }
                                                        {displayOrder
                                                            .billingAddress
                                                            .city &&
                                                            `, ${displayOrder.billingAddress.city}`}
                                                        {displayOrder
                                                            .billingAddress
                                                            .country &&
                                                            `, ${displayOrder.billingAddress.country}`}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                                <div className='space-y-6'>
                                    {course &&
                                        (() => {
                                            const lessonsCount =
                                                (course as any).totalLessons ??
                                                course.lessonsCount ??
                                                0
                                            const durationHours =
                                                course.durationHours ?? 0
                                            const thumbnail =
                                                course.thumbnailUrl ||
                                                (course as any).thumbnail

                                            return (
                                                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                                    <CardHeader>
                                                        <CardTitle className='text-white'>
                                                            Chi tiết khóa học
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className='space-y-6'>
                                                        <div>
                                                            {thumbnail && (
                                                                <Link
                                                                    to={
                                                                        course.slug
                                                                            ? `/courses/${course.slug}`
                                                                            : '#'
                                                                    }
                                                                    className='block cursor-pointer'
                                                                >
                                                                    <img
                                                                        src={
                                                                            thumbnail
                                                                        }
                                                                        alt={
                                                                            course.title
                                                                        }
                                                                        className='w-full h-50 object-cover rounded-lg mb-3 hover:opacity-90 transition-opacity'
                                                                    />
                                                                </Link>
                                                            )}
                                                            <h3 className='font-semibold text-xl mb-2 line-clamp-2 text-white'>
                                                                {course.title}
                                                            </h3>
                                                            <p className='mb-2 text-gray-400 line-clamp-2'>
                                                                {
                                                                    course.description
                                                                }
                                                            </p>
                                                            {course.instructor
                                                                ?.fullName && (
                                                                <p className='text-sm text-gray-400 mb-3'>
                                                                    {
                                                                        course
                                                                            .instructor
                                                                            .fullName
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className='space-y-2 text-sm text-gray-400'>
                                                                <div className='flex items-center gap-2'>
                                                                    <BookOpen className='h-4 w-4' />
                                                                    <span>
                                                                        {
                                                                            lessonsCount
                                                                        }{' '}
                                                                        bài học
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Clock className='h-4 w-4' />
                                                                    <span>
                                                                        {formatDuration(
                                                                            durationHours
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Sparkles className='h-4 w-4' />
                                                                    <span>
                                                                        Chứng
                                                                        chỉ hoàn
                                                                        thành
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Separator className='bg-[#2D2D2D]' />
                                                    </CardContent>
                                                </Card>
                                            )
                                        })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
