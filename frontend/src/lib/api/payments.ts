import apiClient from './client'
import type { ApiResponse } from './types'

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
}
