import apiClient from './client'
import type {
    ApiResponse,
    Coupon,
    CouponFilters,
    CouponUsage,
    CouponUsageHistoryFilters,
    CreateCouponRequest,
    PaginatedApiResponse,
    UpdateCouponRequest,
} from './types'

/**
 * Admin Coupon API client
 */
export const adminCouponsApi = {
    /**
     * Create a new coupon
     */
    async createCoupon(payload: CreateCouponRequest): Promise<Coupon> {
        const response = await apiClient.post<ApiResponse<Coupon>>(
            '/admin/coupons',
            payload,
        )
        return response.data.data
    },

    /**
     * Update a coupon
     */
    async updateCoupon(
        couponId: number,
        payload: UpdateCouponRequest,
    ): Promise<Coupon> {
        const response = await apiClient.put<ApiResponse<Coupon>>(
            `/admin/coupons/${couponId}`,
            payload,
        )
        return response.data.data
    },

    /**
     * Get all coupons with filters and pagination
     */
    async getCoupons(filters?: CouponFilters): Promise<{
        coupons: Coupon[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        if (filters?.search) params.append('search', filters.search)
        if (filters?.active !== undefined)
            params.append('active', filters.active.toString())
        if (filters?.type) params.append('type', filters.type)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Coupon>>(
            `/admin/coupons?${params.toString()}`,
        )
        return {
            coupons: response.data.data,
            pagination: response.data.pagination,
        }
    },

    /**
     * Get coupon details by ID
     */
    async getCouponById(couponId: number): Promise<Coupon> {
        const response = await apiClient.get<ApiResponse<Coupon>>(
            `/admin/coupons/${couponId}`,
        )
        return response.data.data
    },

    /**
     * Delete/Deactivate a coupon
     */
    async deleteCoupon(couponId: number): Promise<{
        deleted: boolean
        deactivated: boolean
        message: string
    }> {
        const response = await apiClient.delete<
            ApiResponse<{
                deleted: boolean
                deactivated: boolean
                message: string
            }>
        >(`/admin/coupons/${couponId}`)
        return response.data.data
    },

    /**
     * Get coupon usage history
     */
    async getCouponUsageHistory(
        couponId: number,
        filters?: CouponUsageHistoryFilters,
    ): Promise<{
        usages: CouponUsage[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())

        const response = await apiClient.get<PaginatedApiResponse<CouponUsage>>(
            `/admin/coupons/${couponId}/usages?${params.toString()}`,
        )
        return {
            usages: response.data.data,
            pagination: response.data.pagination,
        }
    },

    /**
     * Toggle coupon active status
     */
    async toggleCouponActive(id: number | string): Promise<Coupon> {
        const response = await apiClient.patch<ApiResponse<Coupon>>(
            `/admin/coupons/${id}/toggle-active`,
        )
        return response.data.data
    },

    /**
     * Get coupon overview metrics for dashboard
     */
    async getCouponOverview(): Promise<{
        total: number
        active: number
        scheduled: number
        expired: number
        disabled: number
        totalDiscountGiven: number
        totalUsages: number
        ordersWithCoupons: number
    }> {
        const response = await apiClient.get<
            ApiResponse<{
                total: number
                active: number
                scheduled: number
                expired: number
                disabled: number
                totalDiscountGiven: number
                totalUsages: number
                ordersWithCoupons: number
            }>
        >('/admin/coupons/overview')
        return response.data.data
    },
}
