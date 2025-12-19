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

// ==================== Helper Functions - Phần Chung ====================

/**
 * Strip gateway suffix from order code
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

// ==================== Gateway Error Parsers ====================

/**
 * Get VNPay error message by response code
 * Bao gồm tất cả mã lỗi từ: Giao dịch thanh toán, Tra cứu giao dịch, Hoàn trả
 */
const getVNPayErrorMessage = (responseCode: string): string => {
    const messages: Record<string, string> = {
        // ===== Giao dịch thanh toán (vnp_ResponseCode) =====
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
        '15': 'Giao dịch không thành công do: Quá thời gian chờ xác thực OTP hoặc không đúng OTP. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
        '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',

        // ===== Tra cứu giao dịch (vnp_Command=querydr) =====
        '02': 'Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)',
        '03': 'Dữ liệu gửi sang không đúng định dạng',
        '91': 'Không tìm thấy giao dịch yêu cầu',
        '94': 'Yêu cầu bị trùng lặp trong thời gian giới hạn của API (Giới hạn trong 5 phút)',
        '97': 'Chữ ký không hợp lệ',

        // ===== Hoàn trả (vnp_Command=refund) =====
        '04': 'Không cho phép hoàn trả toàn phần sau khi hoàn trả một phần',
    }

    return messages[responseCode] || `Lỗi không xác định (mã ${responseCode})`
}

/**
 * Parse VNPay error message
 */
const parseVNPayError = (params: URLSearchParams): string | null => {
    const vnpCode = params.get('vnp_ResponseCode')
    if (vnpCode && vnpCode !== '00') {
        return getVNPayErrorMessage(vnpCode)
    }
    return null
}

/**
 * Get MoMo error message by result code
 * Bao gồm tất cả result codes từ MoMo Payment Gateway API
 */
const getMoMoErrorMessage = (resultCode: string): string => {
    const messages: Record<string, string> = {
        // ===== Thành công =====
        '0': 'Thành công.',
        '00': 'Thành công.',

        // ===== Lỗi hệ thống =====
        '10': 'Hệ thống đang được bảo trì.',
        '11': 'Truy cập bị từ chối.',
        '12': 'Phiên bản API không được hỗ trợ cho yêu cầu này.',
        '47': 'Yêu cầu bị từ chối vì thông tin không hợp lệ trong danh sách dữ liệu khả dụng',
        '98': 'QR Code tạo không thành công. Vui lòng thử lại sau.',
        '99': 'Lỗi không xác định.',

        // ===== Lỗi xác thực và định dạng =====
        '13': 'Xác thực doanh nghiệp thất bại.',
        '20': 'Yêu cầu sai định dạng.',
        '21': 'Yêu cầu bị từ chối vì số tiền giao dịch không hợp lệ.',
        '22': 'Số tiền giao dịch không hợp lệ.',

        // ===== Lỗi trùng lặp và xung đột =====
        '40': 'RequestId bị trùng.',
        '41': 'OrderId bị trùng.',
        '42': 'OrderId không hợp lệ hoặc không được tìm thấy.',
        '43': 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch.',
        '45': 'Trùng ItemId',

        // ===== Trạng thái giao dịch =====
        '1000': 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán.',
        '1001': 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền.',
        '1002': 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán.',
        '1003': 'Giao dịch bị đã bị hủy.',
        '1004': 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng.',
        '1005': 'Giao dịch thất bại do url hoặc QR code đã hết hạn.',
        '1006': 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán.',
        '1007': 'Giao dịch bị từ chối vì tài khoản không tồn tại hoặc đang ở trạng thái ngưng hoạt động.',
        '1017': 'Giao dịch bị hủy bởi đối tác.',
        '1026': 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi.',

        // ===== Lỗi hoàn tiền =====
        '1080': 'Giao dịch hoàn tiền thất bại trong quá trình xử lý. Vui lòng thử lại trong khoảng thời gian ngắn, tốt hơn là sau một giờ.',
        '1081': 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu có thể đã được hoàn.',
        '1088': 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được hỗ trợ hoàn tiền.',

        // ===== Lỗi khác =====
        '2019': 'Yêu cầu bị từ chối vì orderGroupId không hợp lệ.',
        '4001': 'Giao dịch bị từ chối do tài khoản người dùng đang bị hạn chế.',
        '4002': 'Giao dịch bị từ chối do tài khoản người dùng chưa được xác thực với C06.',
        '4100': 'Giao dịch thất bại do người dùng không đăng nhập thành công.',

        // ===== Trạng thái đang xử lý =====
        '7000': 'Giao dịch đang được xử lý.',
        '7002': 'Giao dịch đang được xử lý bởi nhà cung cấp loại hình thanh toán.',
        '9000': 'Giao dịch đã được xác nhận thành công.',
    }

    return messages[resultCode] || `Lỗi không xác định (mã ${resultCode})`
}

/**
 * Parse MoMo error message
 */
const parseMoMoError = (params: URLSearchParams): string | null => {
    const momoResult = params.get('resultCode')
    if (momoResult && momoResult !== '0' && momoResult !== '00') {
        return getMoMoErrorMessage(momoResult)
    }
    return null
}

/**
 * Parse error message from URL params
 */
const parseErrorMessage = (params: URLSearchParams): string => {
    // Check VNPay error
    if (params.has('vnp_ResponseCode')) {
        const vnpayError = parseVNPayError(params)
        if (vnpayError) return vnpayError
    }

    // Check MoMo error
    if (params.has('resultCode') || params.has('partnerCode')) {
        const momoError = parseMoMoError(params)
        if (momoError) return momoError
    }

    // Fallback to generic error message
    return params.get('error') || 'Thanh toán không thành công'
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

export function PaymentFailurePage() {
    const [searchParams] = useSearchParams()
    const { orderCode, orderId } = getOrderInfoFromParams(searchParams)
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
