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
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react'
import { ordersApi } from '../lib/api/orders'
import type { Order } from '../lib/api/types'
import { OrderSummary } from '../components/Payment/OrderSummary'
import { toast } from 'sonner'

type GatewayResult = 'success' | 'failed' | 'pending' | 'unknown'

const parseGatewayResult = (params: URLSearchParams): GatewayResult => {
    const vnpCode = params.get('vnp_ResponseCode')
    if (vnpCode) {
        if (vnpCode === '00') return 'success'
        return 'failed'
    }

    const momoResult = params.get('resultCode')
    if (momoResult) {
        if (momoResult === '0' || momoResult === '00') return 'success'
        return 'failed'
    }

    return 'unknown'
}

export function PaymentSuccessPage() {
    const [searchParams] = useSearchParams()
    const orderCode =
        searchParams.get('orderCode') ||
        searchParams.get('vnp_TxnRef') ||
        undefined
    const orderId = searchParams.get('orderId') || undefined
    const gatewayResult = parseGatewayResult(searchParams)

    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')
    const [pollCount, setPollCount] = useState(0)

    const fetchOrder = async () => {
        if (!orderCode && !orderId) return
        setStatus('loading')
        try {
            const data = orderCode
                ? await ordersApi.getOrderByCode(orderCode)
                : await ordersApi.getOrderById(orderId as string)
            setOrder(data)
            setStatus('success')
        } catch (error: any) {
            console.error('fetchOrder error', error)
            toast.error(
                error?.response?.data?.message ||
                    'Không thể tải thông tin đơn hàng'
            )
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
    const course = order?.course

    const statusLabel = useMemo(() => {
        if (isPaid) return 'Thanh toán thành công'
        if (isPending) return 'Đang xử lý thanh toán'
        if (gatewayResult === 'failed') return 'Thanh toán không thành công'
        return 'Trạng thái không xác định'
    }, [gatewayResult, isPaid, isPending])

    const isLoading = status === 'loading'

    return (
        <div className='min-h-screen bg-background flex items-center justify-center py-4 px-4'>
            <div className='w-full max-w-3xl'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] text-center'>
                    <CardHeader>
                        <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20'>
                            <CheckCircle className='h-12 w-12 text-green-500' />
                        </div>
                        <CardTitle className='text-3xl text-white'>
                            {statusLabel}
                        </CardTitle>
                        <CardDescription className='text-lg text-gray-400'>
                            {order?.orderCode
                                ? `Mã đơn: ${order.orderCode}`
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

                        <div className='space-y-3'>
                            <p className='text-gray-300'>
                                {isPending
                                    ? 'Thanh toán đang được xử lý. Vui lòng đợi trong giây lát.'
                                    : 'Bạn có thể bắt đầu học ngay hoặc xem lại đơn hàng từ Dashboard.'}
                            </p>
                            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                                <DarkOutlineButton
                                    asChild
                                    size='lg'
                                    className='gap-2'
                                >
                                    <Link
                                        to={
                                            course
                                                ? `/learn/${course.id}`
                                                : '/dashboard'
                                        }
                                    >
                                        Bắt đầu học ngay
                                        <ArrowRight className='ml-2 h-4 w-4' />
                                    </Link>
                                </DarkOutlineButton>
                                <DarkOutlineButton asChild size='lg'>
                                    <Link to='/dashboard'>Về Dashboard</Link>
                                </DarkOutlineButton>
                            </div>
                        </div>

                        <div className='pt-6 border-t border-[#2D2D2D]'>
                            <p className='text-sm text-gray-400 mb-4'>
                                Bạn sẽ nhận được email xác nhận thanh toán trong
                                vài phút tới.
                            </p>
                            <DarkOutlineButton disabled>
                                <Download className='h-4 w-4 mr-2' />
                                Tải hóa đơn (sắp có)
                            </DarkOutlineButton>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
