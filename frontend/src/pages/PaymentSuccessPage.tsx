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
                <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20'>
                    <CheckCircle className='h-12 w-12 text-green-500' />
                </div>
            )
        }
        if ((isPending || gatewaySuccess) && !gatewayFailed) {
            return (
                <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-600/20'>
                    <Clock className='h-12 w-12 text-yellow-500' />
                </div>
            )
        }
        if (isFailed || gatewayFailed) {
            return (
                <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20'>
                    <XCircle className='h-12 w-12 text-red-500' />
                </div>
            )
        }
        return (
            <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-600/20'>
                <CheckCircle className='h-12 w-12 text-gray-500' />
            </div>
        )
    }, [gatewayFailed, gatewaySuccess, isFailed, isPaid, isPending])

    const isLoading = status === 'loading'
    const hasError = status === 'error' && !order

    return (
        <div className='min-h-screen bg-background flex items-center justify-center py-4 px-4'>
            <div className='w-full max-w-3xl'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] text-center'>
                    <CardHeader>
                        {statusIcon}
                        <CardTitle className='text-3xl text-white'>
                            {statusLabel}
                        </CardTitle>
                        <CardDescription className='text-lg text-gray-400'>
                            {order?.orderCode || orderCode
                                ? `Mã đơn: ${order?.orderCode || orderCode}`
                                : hasError
                                ? 'Không tìm thấy thông tin đơn hàng'
                                : 'Cảm ơn bạn đã mua khóa học'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {isLoading && (
                            <div className='flex justify-center py-6 text-gray-300 items-center gap-2'>
                                <Loader2 className='h-5 w-5 animate-spin' />
                                Đang cập nhật trạng thái đơn hàng...
                            </div>
                        )}

                        {hasError && (
                            <div className='bg-red-900/20 border border-red-800/30 rounded-lg p-6 text-left'>
                                <p className='text-red-400'>
                                    Không thể tải thông tin đơn hàng. Vui lòng
                                    kiểm tra lại hoặc liên hệ hỗ trợ.
                                </p>
                            </div>
                        )}

                        {!isLoading && order && (
                            <div className='bg-[#1F1F1F] rounded-lg p-6 text-left'>
                                <OrderSummary course={order.course || null} />
                                <div className='mt-4 text-sm text-gray-300 space-y-1'>
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

                        {!hasError && (
                            <div className='space-y-3'>
                                <p className='text-gray-300'>
                                    {isPaid
                                        ? 'Bạn có thể bắt đầu học ngay hoặc xem lại đơn hàng từ Dashboard.'
                                        : isFailed || gatewayFailed
                                        ? 'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'
                                        : 'Thanh toán đang được xử lý. Vui lòng đợi trong giây lát.'}
                                </p>
                                <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                                    {isPaid && course && (
                                        <DarkOutlineButton
                                            asChild
                                            size='lg'
                                            className='gap-2'
                                        >
                                            <Link
                                                to={`/courses/${course.slug}/lessons`}
                                            >
                                                Bắt đầu học ngay
                                                <ArrowRight className='ml-2 h-4 w-4' />
                                            </Link>
                                        </DarkOutlineButton>
                                    )}
                                    <DarkOutlineButton asChild size='lg'>
                                        <Link to='/dashboard'>
                                            Về Dashboard
                                        </Link>
                                    </DarkOutlineButton>
                                    {(isFailed ||
                                        gatewayResult === 'failed') && (
                                        <DarkOutlineButton asChild size='lg'>
                                            <Link to='/courses'>
                                                Xem khóa học
                                            </Link>
                                        </DarkOutlineButton>
                                    )}
                                </div>
                            </div>
                        )}

                        {isPaid && (
                            <div className='pt-6 border-t border-[#2D2D2D]'>
                                <p className='text-sm text-gray-400 mb-4'>
                                    Bạn sẽ nhận được email xác nhận thanh toán
                                    trong vài phút tới.
                                </p>
                                <DarkOutlineButton disabled>
                                    <Download className='h-4 w-4 mr-2' />
                                    Tải hóa đơn (sắp có)
                                </DarkOutlineButton>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
