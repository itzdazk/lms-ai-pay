import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import {
    CheckCircle,
    Download,
    ArrowRight,
    Loader2,
    XCircle,
    Clock,
} from 'lucide-react'
import { ordersApi } from '../lib/api/orders'
import type { Order } from '../lib/api/types'
import { OrderSummary } from '../components/Payment/OrderSummary'

// ==================== Helper Functions - Phần Chung ====================

type GatewayResult = 'success' | 'failed' | 'pending' | 'unknown'

/**
 * Strip gateway suffix from order code
 * VNPay/MoMo append "-<Gateway>-<random>" after the orderCode
 */
const stripGatewaySuffix = (code?: string | null): string | undefined => {
    if (!code) return undefined
    return code.replace(/-(VNPay|MoMo)-[\w-]+$/i, '')
}

/**
 * Decode extraData from MoMo
 */
const decodeExtraData = (
    extraData: string | null
): { orderCode?: string; orderId?: number } | null => {
    if (!extraData) return null

    try {
        const decoded = JSON.parse(atob(extraData))
        return {
            orderCode: decoded.orderCode,
            orderId: decoded.orderId,
        }
    } catch {
        return null
    }
}

// ==================== Gateway Parsers ====================

/**
 * Parse VNPay gateway result
 */
const parseVNPayResult = (params: URLSearchParams): GatewayResult => {
    const vnpResponseCode = params.get('vnp_ResponseCode')
    const vnpTransactionStatus = params.get('vnp_TransactionStatus')

    if (vnpResponseCode === null && vnpTransactionStatus === null) {
        return 'unknown'
    }

    // VNPay success: both codes should be '00'
    if (vnpResponseCode === '00' || vnpTransactionStatus === '00') {
        return 'success'
    }

    return 'failed'
}

/**
 * Parse MoMo gateway result
 */
const parseMoMoResult = (params: URLSearchParams): GatewayResult => {
    const momoResult = params.get('resultCode')

    if (momoResult === null) {
        return 'unknown'
    }

    if (momoResult === '0' || momoResult === '00') {
        return 'success'
    }

    return 'failed'
}

/**
 * Parse gateway result from URL params
 */
const parseGatewayResult = (params: URLSearchParams): GatewayResult => {
    // Check VNPay first
    if (params.has('vnp_ResponseCode') || params.has('vnp_TxnRef')) {
        return parseVNPayResult(params)
    }

    // Check MoMo
    if (params.has('resultCode') || params.has('partnerCode')) {
        return parseMoMoResult(params)
    }

    return 'unknown'
}

/**
 * Extract order information from URL params
 */
const getOrderInfoFromParams = (
    params: URLSearchParams
): { orderCode?: string; orderId?: string } => {
    const extraData = params.get('extraData')
    const decoded = decodeExtraData(extraData)

    const rawOrderCode =
        params.get('orderCode') ||
        params.get('vnp_TxnRef') ||
        params.get('orderId') ||
        decoded?.orderCode

    const rawOrderId = params.get('orderId') || decoded?.orderId?.toString()

    const orderCode = stripGatewaySuffix(rawOrderCode)
    const numericOrderId =
        rawOrderId && /^\d+$/.test(rawOrderId) ? rawOrderId : undefined

    return {
        orderCode: orderCode || undefined,
        orderId: numericOrderId || undefined,
    }
}

export function PaymentSuccessPage() {
    const [searchParams] = useSearchParams()
    const { orderCode, orderId } = getOrderInfoFromParams(searchParams)
    const gatewayResult = parseGatewayResult(searchParams)

    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')
    const [pollCount, setPollCount] = useState(0)

    const fetchOrder = async () => {
        if (!orderCode && !orderId) {
            setStatus('error')
            return
        }

        setStatus('loading')
        try {
            const data = orderCode
                ? await ordersApi.getOrderByCode(orderCode)
                : await ordersApi.getOrderById(orderId as string)
            setOrder(data)
            setStatus('success')
        } catch (error: any) {
            setStatus('error')
        }
    }

    useEffect(() => {
        fetchOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, orderId])

    useEffect(() => {
        if (!order || order.paymentStatus !== 'PENDING') return
        if (pollCount >= 12) return

        const interval = setInterval(async () => {
            try {
                const data = orderCode
                    ? await ordersApi.getOrderByCode(orderCode)
                    : await ordersApi.getOrderById(orderId as string)
                setOrder(data)
                setPollCount((c) => c + 1)
                if (data.paymentStatus !== 'PENDING') {
                    clearInterval(interval)
                }
            } catch (error) {
                clearInterval(interval)
            }
        }, 5000)

        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order, pollCount, orderCode, orderId])

    const isPaid = order?.paymentStatus === 'PAID'
    const isPending = order?.paymentStatus === 'PENDING'
    const isFailed = order?.paymentStatus === 'FAILED'
    const gatewaySuccess = gatewayResult === 'success'
    const gatewayFailed = gatewayResult === 'failed'
    const course = order?.course

    const statusLabel = useMemo(() => {
        if (isPaid) return 'Thanh toán thành công'
        if (isFailed || gatewayFailed) return 'Thanh toán không thành công'
        if (isPending || gatewaySuccess) return 'Đang xử lý thanh toán'
        return 'Trạng thái không xác định'
    }, [gatewayFailed, gatewaySuccess, isFailed, isPaid, isPending])

    const statusIcon = useMemo(() => {
        if (isPaid) {
            return (
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 shrink-0'>
                    <CheckCircle className='h-10 w-10 text-green-500' />
                </div>
            )
        }
        if ((isPending || gatewaySuccess) && !gatewayFailed) {
            return (
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-yellow-600/20 shrink-0'>
                    <Clock className='h-10 w-10 text-yellow-500' />
                </div>
            )
        }
        if (isFailed || gatewayFailed) {
            return (
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 shrink-0'>
                    <XCircle className='h-10 w-10 text-red-500' />
                </div>
            )
        }
        return (
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-600/20 shrink-0'>
                <CheckCircle className='h-10 w-10 text-gray-500' />
            </div>
        )
    }, [gatewayFailed, gatewaySuccess, isFailed, isPaid, isPending])

    const isLoading = status === 'loading'
    const hasError = status === 'error' && !order

    return (
        <div className='h-screen bg-background flex items-center justify-center p-3 overflow-hidden'>
            <div className='w-full max-w-6xl h-full max-h-[95vh]'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] h-full flex flex-col'>
                    {/* Compact Header - Horizontal */}
                    <CardHeader className='pb-3 border-b border-[#2D2D2D] shrink-0'>
                        <div className='flex items-center gap-4'>
                            {statusIcon}
                            <div className='flex-1 min-w-0'>
                                <CardTitle className='text-xl lg:text-2xl text-white mb-1'>
                                    {statusLabel}
                                </CardTitle>
                                <CardDescription className='text-xs lg:text-sm text-gray-400 truncate'>
                                    {order?.orderCode || orderCode
                                        ? `Mã đơn: ${
                                              order?.orderCode || orderCode
                                          }`
                                        : hasError
                                        ? 'Không tìm thấy thông tin đơn hàng'
                                        : 'Cảm ơn bạn đã mua khóa học'}
                                </CardDescription>
                            </div>
                            {!isLoading && order && (
                                <div className='hidden lg:flex flex-col gap-1 text-right shrink-0'>
                                    <span className='text-xs text-gray-400'>
                                        Trạng thái
                                    </span>
                                    <span className='text-sm font-medium text-white'>
                                        {order.paymentStatus}
                                    </span>
                                    <span className='text-xs text-gray-400'>
                                        Tổng:{' '}
                                        {order.finalPrice.toLocaleString(
                                            'vi-VN'
                                        )}{' '}
                                        ₫
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    {/* Main Content - 2 Columns */}
                    <CardContent className='flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden min-h-0'>
                        {/* Left Column - Order Summary */}
                        <div className='flex-1 flex flex-col min-w-0'>
                            {isLoading && (
                                <div className='flex justify-center items-center h-full text-gray-300 gap-2'>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    <span className='text-sm'>
                                        Đang cập nhật trạng thái...
                                    </span>
                                </div>
                            )}

                            {hasError && (
                                <div className='flex items-center justify-center h-full'>
                                    <div className='bg-red-900/20 border border-red-800/30 rounded-lg p-4 max-w-md'>
                                        <p className='text-sm text-red-400 text-center'>
                                            Không thể tải thông tin đơn hàng.
                                            Vui lòng kiểm tra lại hoặc liên hệ
                                            hỗ trợ.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isLoading && order && (
                                <div className='bg-[#1F1F1F] rounded-lg p-4 flex-1 min-h-0 overflow-y-auto'>
                                    <OrderSummary
                                        course={order.course || null}
                                    />
                                    <div className='mt-3 pt-3 border-t border-[#2D2D2D] lg:hidden text-xs text-gray-300 space-y-1'>
                                        <p>Trạng thái: {order.paymentStatus}</p>
                                        <p>
                                            Tổng:{' '}
                                            {order.finalPrice.toLocaleString(
                                                'vi-VN'
                                            )}{' '}
                                            ₫
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Actions & Info */}
                        <div className='lg:w-80 flex flex-col gap-3 shrink-0'>
                            {!hasError && (
                                <>
                                    <div className='bg-[#1F1F1F] rounded-lg p-4'>
                                        <p className='text-xs text-gray-300 mb-3'>
                                            {isPaid
                                                ? 'Bạn có thể bắt đầu học ngay hoặc xem lại đơn hàng.'
                                                : isFailed || gatewayFailed
                                                ? 'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'
                                                : 'Thanh toán đang được xử lý. Vui lòng đợi trong giây lát.'}
                                        </p>
                                        <div className='flex flex-col gap-2'>
                                            {isPaid && course && (
                                                <DarkOutlineButton
                                                    asChild
                                                    size='sm'
                                                    className='w-full'
                                                >
                                                    <Link
                                                        to={`/courses/${course.slug}/lessons`}
                                                    >
                                                        Bắt đầu học ngay
                                                        <ArrowRight className='h-3 w-3 ml-2' />
                                                    </Link>
                                                </DarkOutlineButton>
                                            )}
                                            {order?.id && (
                                                <DarkOutlineButton
                                                    asChild
                                                    size='sm'
                                                    className='w-full'
                                                >
                                                    <Link
                                                        to={`/orders/${order.id}`}
                                                    >
                                                        Xem chi tiết đơn hàng
                                                    </Link>
                                                </DarkOutlineButton>
                                            )}
                                            {(isFailed ||
                                                gatewayResult === 'failed') && (
                                                <DarkOutlineButton
                                                    asChild
                                                    size='sm'
                                                    className='w-full'
                                                >
                                                    <Link to='/courses'>
                                                        Xem khóa học
                                                    </Link>
                                                </DarkOutlineButton>
                                            )}
                                        </div>
                                    </div>

                                    {isPaid && (
                                        <div className='bg-[#1F1F1F] rounded-lg p-4 border-t border-[#2D2D2D]'>
                                            <p className='text-xs text-gray-400 mb-3'>
                                                Bạn sẽ nhận được email xác nhận
                                                thanh toán trong vài phút tới.
                                            </p>
                                            <DarkOutlineButton
                                                disabled
                                                size='sm'
                                                className='w-full'
                                            >
                                                <Download className='h-3 w-3 mr-2' />
                                                Tải hóa đơn (sắp có)
                                            </DarkOutlineButton>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
