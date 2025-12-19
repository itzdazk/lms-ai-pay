import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentsApi } from '../lib/api/payments'
import type { PaymentCallbackResponse } from '../lib/api/types'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ==================== Helper Functions - Phần Chung====================

/**
 * Extract all query parameters from URLSearchParams
 * Extract tất cả params từ URLSearchParams
 */
const extractParams = (
    searchParams: URLSearchParams
): Record<string, string> => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
        params[key] = value
    })
    return params
}

/**
 * Detect gateway type from params
 * * Phát hiện gateway type (VNPay/MoMo)
 */
const detectGateway = (
    params: Record<string, string>
): 'VNPay' | 'MoMo' | null => {
    const isVNPay = !!params.vnp_ResponseCode || !!params.vnp_TxnRef
    const isMoMo = !!params.resultCode || !!params.partnerCode

    if (isVNPay) return 'VNPay'
    if (isMoMo) return 'MoMo'
    return null
}

/**
 * Build base redirect params with order information
 * * Tạo base redirect params với order info
 */
const buildBaseRedirectParams = (
    order: PaymentCallbackResponse['order']
): URLSearchParams => {
    const params = new URLSearchParams()
    if (order.orderCode) {
        params.set('orderCode', order.orderCode)
    }
    if (order.id) {
        params.set('orderId', order.id.toString())
    }
    return params
}

/**
 * Preserve VNPay-specific params for redirect
 * * Bảo toàn các tham số dành riêng cho VNPay (vnp_ResponseCode, vnp_TransactionStatus, vnp_TxnRef)
 */
const preserveVNPayParams = (
    params: Record<string, string>,
    redirectParams: URLSearchParams
): void => {
    if (params.vnp_ResponseCode) {
        redirectParams.set('vnp_ResponseCode', params.vnp_ResponseCode)
    }
    if (params.vnp_TransactionStatus) {
        redirectParams.set(
            'vnp_TransactionStatus',
            params.vnp_TransactionStatus
        )
    }
    if (params.vnp_TxnRef) {
        redirectParams.set('vnp_TxnRef', params.vnp_TxnRef)
    }
}

/**
 * Preserve MoMo-specific params for redirect
 * * preserveMoMoParams() - Bảo toàn các tham số dành riêng cho MoMo (resultCode, message, extraData)
 */
const preserveMoMoParams = (
    params: Record<string, string>,
    redirectParams: URLSearchParams
): void => {
    if (params.resultCode) {
        redirectParams.set('resultCode', params.resultCode)
    }
    if (params.message) {
        redirectParams.set('message', params.message)
    }
    if (params.extraData) {
        redirectParams.set('extraData', params.extraData)
    }
}

/**
 * Get redirect URL based on payment status
 * * Xác định redirect URL dựa trên payment statuss
 */
const getRedirectUrl = (
    paymentStatus: string,
    redirectParams: URLSearchParams
): string => {
    const paramsString = redirectParams.toString()

    if (paymentStatus === 'PAID') {
        return `/payment/success?${paramsString}`
    }

    if (paymentStatus === 'FAILED') {
        return `/payment/failure?${paramsString}`
    }

    // PENDING or other status - redirect to success page with pending status
    // The success page will handle polling for status updates
    return `/payment/success?${paramsString}`
}

// ==================== Gateway Handlers ====================

/**
 * Handle VNPay callback
 * * Xử lý callback từ VNPay
 */
const handleVNPayCallback = async (
    params: Record<string, string>
): Promise<PaymentCallbackResponse> => {
    const result = await paymentsApi.verifyVNPayCallback(params)
    return result
}

/**
 * Handle MoMo callback
 * * Xử lý callback từ MoMo
 */
const handleMoMoCallback = async (
    params: Record<string, string>
): Promise<PaymentCallbackResponse> => {
    const result = await paymentsApi.verifyMoMoCallback(params)
    return result
}

// ==================== Error Handler ====================

/**
 * Handle error and extract order info for redirect
 * * Xử lý lỗi và extract order info từ params
 */
const handleError = (
    error: any,
    searchParams: URLSearchParams
): URLSearchParams => {
    const redirectParams = new URLSearchParams()

    // Try to extract order info from MoMo extraData
    const extraData = searchParams.get('extraData')
    if (extraData) {
        try {
            const decoded = JSON.parse(atob(extraData))
            if (decoded.orderCode) {
                redirectParams.set('orderCode', decoded.orderCode)
            }
            if (decoded.orderId) {
                redirectParams.set('orderId', decoded.orderId.toString())
            }
        } catch (e) {
            // Failed to decode extraData
        }
    }

    // Try to get orderCode from params (VNPay or MoMo)
    const orderCode =
        searchParams.get('orderCode') ||
        searchParams.get('orderId') ||
        searchParams.get('vnp_TxnRef')
    if (orderCode) {
        redirectParams.set('orderCode', orderCode)
    }

    // Add error message
    const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể xác thực thanh toán'
    redirectParams.set('error', errorMessage)

    return redirectParams
}

// ==================== Main Component ====================

/**
 * Intermediate page to handle payment callbacks (VNPay & MoMo)
 * - Receives callback from payment gateway
 * - Detects gateway type (VNPay or MoMo)
 * - Verifies payment with backend (webhook-safe)
 * - Redirects to success or failure page
 */
export function PaymentResultPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'processing' | 'error'>('processing')

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Extract all query parameters
                const params = extractParams(searchParams)

                // Detect gateway type
                const gateway = detectGateway(params)
                if (!gateway) {
                    throw new Error('Không xác định được gateway thanh toán')
                }

                // Verify callback with backend (this verifies signature and processes payment)
                const result =
                    gateway === 'VNPay'
                        ? await handleVNPayCallback(params)
                        : await handleMoMoCallback(params)

                // Extract order information
                const order = result.order
                const paymentStatus = order.paymentStatus

                // Build redirect URL with order information and gateway-specific params
                const redirectParams = buildBaseRedirectParams(order)

                // Preserve gateway-specific params
                if (gateway === 'VNPay') {
                    preserveVNPayParams(params, redirectParams)
                } else {
                    preserveMoMoParams(params, redirectParams)
                }

                // Redirect based on payment status
                const redirectUrl = getRedirectUrl(
                    paymentStatus,
                    redirectParams
                )

                navigate(redirectUrl, {
                    replace: true,
                })
            } catch (error: any) {
                setStatus('error')

                // Handle error and build redirect params
                const redirectParams = handleError(error, searchParams)

                // Show error toast
                const errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    'Không thể xác thực thanh toán'
                toast.error(errorMessage)

                // Redirect to failure page after a short delay
                const failureUrl = `/payment/failure?${redirectParams.toString()}`
                setTimeout(() => {
                    navigate(failureUrl, {
                        replace: true,
                    })
                }, 2000)
            }
        }

        processCallback()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className='min-h-screen bg-background flex items-center justify-center'>
            <div className='text-center space-y-4'>
                {status === 'processing' ? (
                    <>
                        <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto' />
                        <p className='text-lg text-foreground'>
                            Đang xác thực thanh toán...
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            Vui lòng đợi trong giây lát
                        </p>
                    </>
                ) : (
                    <>
                        <p className='text-lg text-destructive'>
                            Đã xảy ra lỗi khi xử lý thanh toán
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            Đang chuyển hướng...
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
