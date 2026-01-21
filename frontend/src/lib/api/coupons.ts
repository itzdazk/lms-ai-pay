import apiClient from './client'
import type {
    ApiResponse,
    ApplyCouponRequest,
    ApplyCouponResponse,
    GetAvailableCouponsParams,
    PaginatedApiResponse,
    AvailableCoupon,
} from './types'

/**
 * User Coupon API client
 */
export const couponsApi = {
    /**
     * Get available coupons for student
     */
    async getAvailableCoupons(
        params?: GetAvailableCouponsParams,
    ): Promise<PaginatedApiResponse<AvailableCoupon>> {
        const response = await apiClient.get<
            PaginatedApiResponse<AvailableCoupon>
        >('/coupons/available', { params })
        return response.data
    },

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
