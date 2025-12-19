import apiClient from './client'
import type { ApiResponse, PaymentCallbackResponse } from './types'

type PaymentUrlResponse = {
    paymentUrl?: string
    payUrl?: string
}

export const paymentsApi = {
    async createVNPayUrl(orderId: number | string): Promise<string> {
        const response = await apiClient.post<ApiResponse<PaymentUrlResponse>>(
            '/payments/vnpay/create',
            { orderId }
        )
        const url = response.data.data.paymentUrl || response.data.data.payUrl
        if (!url) {
            throw new Error('Không nhận được paymentUrl từ VNPay')
        }
        return url
    },

    async createMoMoUrl(orderId: number | string): Promise<string> {
        const response = await apiClient.post<ApiResponse<PaymentUrlResponse>>(
            '/payments/momo/create',
            { orderId }
        )
        const url = response.data.data.paymentUrl || response.data.data.payUrl
        if (!url) {
            throw new Error('Không nhận được paymentUrl từ MoMo')
        }
        return url
    },

    /**
     * Verify MoMo payment callback (webhook-safe)
     * This endpoint verifies the signature and processes the payment
     */
    async verifyMoMoCallback(
        params: Record<string, string>
    ): Promise<PaymentCallbackResponse> {
        const response = await apiClient.get<
            ApiResponse<PaymentCallbackResponse>
        >('/payments/momo/callback', { params })
        return response.data.data
    },

    /**
     * Verify VNPay payment callback (webhook-safe)
     * This endpoint verifies the signature and processes the payment
     */
    async verifyVNPayCallback(
        params: Record<string, string>
    ): Promise<PaymentCallbackResponse> {
        const response = await apiClient.get<
            ApiResponse<PaymentCallbackResponse>
        >('/payments/vnpay/callback', { params })
        return response.data.data
    },
}
