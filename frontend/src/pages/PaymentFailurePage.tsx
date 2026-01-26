import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
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

// ==================== Helper Functions - Phần Chung ====================

/**
 * Translate payment status to Vietnamese
 */
const translatePaymentStatus = (status: Order['paymentStatus']): string => {
    switch (status) {
        case 'PAID':
            return 'Đã thanh toán'
        case 'PENDING':
            return 'Đang chờ thanh toán'
        case 'FAILED':
            return 'Thanh toán thất bại'
        case 'REFUNDED':
            return 'Đã hoàn tiền'
        case 'PARTIALLY_REFUNDED':
            return 'Hoàn tiền một phần'
        case 'REFUND_PENDING':
            return 'Đang chờ hoàn tiền'
        case 'REFUND_FAILED':
            return 'Hoàn tiền thất bại'
        default:
            return status
    }
}

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
    extraData: string | null,
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
 * Check if payment was actually successful (should redirect to success page)
 */
const isPaymentSuccessful = (params: URLSearchParams): boolean => {
    // Check VNPay success
    const vnpCode = params.get('vnp_ResponseCode')
    const vnpStatus = params.get('vnp_TransactionStatus')
    if (vnpCode === '00' || vnpStatus === '00') {
        return true
    }

    // Check MoMo success
    const momoResult = params.get('resultCode')
    if (momoResult === '0' || momoResult === '00' || momoResult === '9000') {
        return true
    }

    return false
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
    params: URLSearchParams,
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
    const navigate = useNavigate()
    const { orderCode, orderId } = getOrderInfoFromParams(searchParams)
    const error = parseErrorMessage(searchParams)

    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle')

    // Redirect to success page if payment was actually successful
    useEffect(() => {
        if (isPaymentSuccessful(searchParams)) {
            // Build success URL with same params
            const successParams = new URLSearchParams(searchParams)
            const successUrl = `/payment/success?${successParams.toString()}`
            navigate(successUrl, { replace: true })
        }
    }, [searchParams, navigate])

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
            setStatus('error')
        }
    }

    useEffect(() => {
        fetchOrder()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderCode, orderId])

    const course = order?.course
    const isLoading = status === 'loading'

    return (
        <div className='h-screen bg-background flex items-center justify-center p-3 overflow-hidden'>
            <div className='w-full max-w-6xl h-full max-h-[95vh]'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] h-full flex flex-col'>
                    {/* Compact Header - Horizontal */}
                    <CardHeader className='pb-3 border-b border-[#2D2D2D] shrink-0'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 shrink-0'>
                                <XCircle className='h-10 w-10 text-red-500' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <CardTitle className='text-xl lg:text-2xl text-white mb-1'>
                                    Thanh toán thất bại
                                </CardTitle>
                                <CardDescription className='text-xs lg:text-sm text-gray-400 space-y-1'>
                                    <div className='line-clamp-1'>{error}</div>
                                    <div className='text-gray-500'>
                                        Mã đơn:{' '}
                                        <span className='text-gray-300 font-mono'>
                                            {order?.orderCode || orderCode}
                                        </span>
                                    </div>
                                </CardDescription>
                            </div>
                            {!isLoading && order && (
                                <div className='hidden lg:flex flex-col gap-1 text-right shrink-0'>
                                    <span className='text-xs text-gray-400'>
                                        Trạng thái
                                    </span>
                                    <span className='text-sm font-medium text-white'>
                                        {translatePaymentStatus(
                                            order.paymentStatus,
                                        )}
                                    </span>
                                    <span className='text-xs text-gray-400'>
                                        Tổng:{' '}
                                        {order.finalPrice.toLocaleString(
                                            'vi-VN',
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
                            {status === 'loading' && (
                                <div className='flex justify-center items-center h-full text-gray-300 gap-2'>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    <span className='text-sm'>
                                        Đang lấy thông tin đơn hàng...
                                    </span>
                                </div>
                            )}

                            {!order && status !== 'loading' && (
                                <div className='flex items-center justify-center h-full'>
                                    <div className='bg-[#1F1F1F] rounded-lg p-4 max-w-md'>
                                        <p className='text-sm text-gray-400 text-center'>
                                            Không tìm thấy thông tin đơn hàng.
                                            Vui lòng thử lại.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {order && (
                                <div className='bg-[#1F1F1F] rounded-lg p-4 flex-1 min-h-0 overflow-y-auto'>
                                    <OrderSummary
                                        course={order.course || null}
                                        order={order}
                                    />
                                    <div className='mt-3 pt-3 border-t border-[#2D2D2D] lg:hidden text-xs text-gray-300 space-y-1'>
                                        <p>Mã đơn: {order.orderCode}</p>
                                        <p>
                                            Trạng thái:{' '}
                                            {translatePaymentStatus(
                                                order.paymentStatus,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Actions & Info */}
                        <div className='lg:w-80 flex flex-col gap-3 shrink-0'>
                            <div className='bg-[#1F1F1F] rounded-lg p-4'>
                                <p className='text-xs text-gray-300 mb-3'>
                                    Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn
                                    đề vẫn tiếp tục.
                                </p>
                                <div className='flex flex-col gap-2'>
                                    {course && (
                                        <DarkOutlineButton
                                            asChild
                                            size='sm'
                                            className='w-full'
                                        >
                                            <Link
                                                to={`/checkout/${course.slug}`}
                                            >
                                                <RefreshCw className='mr-2 h-3 w-3' />
                                                Thử lại thanh toán
                                            </Link>
                                        </DarkOutlineButton>
                                    )}
                                    <DarkOutlineButton
                                        asChild
                                        size='sm'
                                        className='w-full'
                                    >
                                        <Link
                                            to={
                                                course?.slug
                                                    ? `/courses/${course.slug}`
                                                    : '/courses'
                                            }
                                        >
                                            <ArrowLeft className='mr-2 h-3 w-3' />
                                            {course?.slug
                                                ? 'Quay lại khóa học'
                                                : 'Xem khóa học'}
                                        </Link>
                                    </DarkOutlineButton>
                                </div>
                            </div>

                            <div className='bg-[#1F1F1F] rounded-lg p-4 border-t border-[#2D2D2D]'>
                                <p className='text-xs text-gray-400 mb-2'>
                                    Cần hỗ trợ? Liên hệ chúng tôi:
                                </p>
                                <p className='text-sm text-blue-500'>
                                    support@edulearn.vn
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
