import apiClient from './client'
import type {
    ApiResponse,
    ApplyCouponRequest,
    ApplyCouponResponse,
} from './types'

/**
 * User Coupon API client
 */
export const couponsApi = {
    /**
     * Apply coupon code to check validity and calculate discount
     */
    async applyCoupon(
        payload: ApplyCouponRequest,
    ): Promise<ApplyCouponResponse> {
        const response = await apiClient.post<ApiResponse<ApplyCouponResponse>>(
            '/coupons/apply',
            payload,
        )
        return response.data.data
    },
}
