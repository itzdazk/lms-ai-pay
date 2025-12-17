import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { XCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react'
import { ordersApi } from '../lib/api/orders'
import type { Order } from '../lib/api/types'
import { OrderSummary } from '../components/Payment/OrderSummary'
import { toast } from 'sonner'

const parseErrorMessage = (params: URLSearchParams): string => {
    const vnpCode = params.get('vnp_ResponseCode')
    if (vnpCode && vnpCode !== '00') {
        return `VNPay lỗi mã ${vnpCode}`
    }
    const momoResult = params.get('resultCode')
    if (momoResult && momoResult !== '0' && momoResult !== '00') {
        return `MoMo lỗi mã ${momoResult}`
    }
    return params.get('error') || 'Thanh toán không thành công'
}

export function PaymentFailurePage() {
    const [searchParams] = useSearchParams()
    const orderCode =
        searchParams.get('orderCode') ||
        searchParams.get('vnp_TxnRef') ||
        undefined
    const orderId = searchParams.get('orderId') || undefined
    const error = parseErrorMessage(searchParams)

    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')

    const fetchOrder = async () => {
        if (!orderCode && !orderId) return
        setStatus('loading')
        try {
            const data = orderCode
                ? await ordersApi.getOrderByCode(orderCode)
                : await ordersApi.getOrderById(orderId as string)
            setOrder(data)
            setStatus('success')
        } catch (err: any) {
            console.error('fetchOrder failure page', err)
            toast.error(
                err?.response?.data?.message || 'Không thể tải đơn hàng'
            )
            setStatus('error')
        }
    }

    useEffect(() => {
        fetchOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, orderId])

    const course = order?.course

    return (
        <div className='min-h-screen bg-background flex items-center justify-center py-4 px-4'>
            <div className='w-full max-w-3xl'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] text-center'>
                    <CardHeader>
                        <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20'>
                            <XCircle className='h-12 w-12 text-red-500' />
                        </div>
                        <CardTitle className='text-3xl text-white'>
                            Thanh toán thất bại
                        </CardTitle>
                        <CardDescription className='text-lg text-gray-400'>
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {status === 'loading' && (
                            <div className='flex justify-center py-4 text-gray-300 items-center gap-2'>
                                <Loader2 className='h-5 w-5 animate-spin' />
                                Đang lấy thông tin đơn hàng...
                            </div>
                        )}

                        {!order && status !== 'loading' && (
                            <p className='text-sm text-gray-400'>
                                Không tìm thấy thông tin đơn hàng. Vui lòng thử
                                lại.
                            </p>
                        )}

                        {order && (
                            <div className='bg-[#1F1F1F] rounded-lg p-6 text-left'>
                                <OrderSummary course={order.course || null} />
                                <div className='mt-4 text-sm text-gray-300 space-y-1'>
                                    <p>Mã đơn: {order.orderCode}</p>
                                    <p>Trạng thái: {order.paymentStatus}</p>
                                </div>
                            </div>
                        )}

                        <div className='space-y-3'>
                            <p className='text-gray-300'>
                                Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề
                                vẫn tiếp tục.
                            </p>
                            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                                {course && (
                                    <DarkOutlineButton asChild size='lg'>
                                        <Link to={`/checkout/${course.id}`}>
                                            <RefreshCw className='mr-2 h-4 w-4' />
                                            Thử lại thanh toán
                                        </Link>
                                    </DarkOutlineButton>
                                )}
                                <DarkOutlineButton asChild size='lg'>
                                    <Link to='/courses'>
                                        <ArrowLeft className='mr-2 h-4 w-4' />
                                        Quay lại khóa học
                                    </Link>
                                </DarkOutlineButton>
                            </div>
                        </div>

                        <div className='pt-6 border-t border-[#2D2D2D]'>
                            <p className='text-sm text-gray-400 mb-2'>
                                Cần hỗ trợ? Liên hệ chúng tôi:
                            </p>
                            <p className='text-sm text-blue-500'>
                                support@edulearn.vn
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
