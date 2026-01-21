import apiClient from './client'
import type {
    ApiResponse,
    PaginatedApiResponse,
    Coupon,
    CreateCouponRequest,
    UpdateCouponRequest,
    CouponFilters,
    CouponUsageHistoryFilters,
    CouponUsage,
} from './types'

/**
 * Admin Coupons API client
 */
export const adminCouponsApi = {
    /**
     * Get all coupons with admin filters
     */
    async getCoupons(filters?: CouponFilters): Promise<{
        data: Coupon[]
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
        if (filters?.active !== undefined && filters?.active !== '')
            params.append('active', filters.active.toString())
        if (filters?.type) params.append('type', filters.type)
        if (filters?.sort) params.append('sort', filters.sort)

        const response = await apiClient.get<PaginatedApiResponse<Coupon>>(
            `/admin/coupons?${params.toString()}`,
        )
        return {
            data: response.data.data,
            pagination: response.data.pagination,
        }
    },

    /**
     * Get coupon details by ID
     */
    async getCouponById(id: number | string): Promise<Coupon> {
        const response = await apiClient.get<ApiResponse<Coupon>>(
            `/admin/coupons/${id}`,
        )
        return response.data.data
    },

    /**
     * Create a new coupon
     */
    async createCoupon(data: CreateCouponRequest): Promise<Coupon> {
        const response = await apiClient.post<ApiResponse<Coupon>>(
            '/admin/coupons',
            data,
        )
        return response.data.data
    },

    /**
     * Update an existing coupon
     */
    async updateCoupon(
        id: number | string,
        data: UpdateCouponRequest,
    ): Promise<Coupon> {
        const response = await apiClient.put<ApiResponse<Coupon>>(
            `/admin/coupons/${id}`,
            data,
        )
        return response.data.data
    },

    /**
     * Delete (or deactivate) a coupon
     */
    async deleteCoupon(
        id: number | string,
    ): Promise<{ deleted: boolean; deactivated: boolean; message: string }> {
        const response = await apiClient.delete<
            ApiResponse<{
                deleted: boolean
                deactivated: boolean
                message: string
            }>
        >(`/admin/coupons/${id}`)
        return response.data.data
    },

    /**
     * Get usage history for a specific coupon
     */
    async getCouponUsageHistory(
        id: number | string,
        filters?: CouponUsageHistoryFilters,
    ): Promise<{
        usages: CouponUsage[]
        total: number
    }> {
        const params = new URLSearchParams()
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())

        const response = await apiClient.get<
            PaginatedApiResponse<CouponUsage> & {
                pagination: { total: number }
            }
        >(`/admin/coupons/${id}/usages?${params.toString()}`)

        // Note: The backend returns { usages: [], total: ... } inside data, or paginated structure?
        // Checking backend controller: it returns ApiResponse.paginated(res, result.usages, ...)
        // So response.data.data is the usages array.
        // We will adapt to return what the component expects.

        return {
            usages: response.data.data,
            total: response.data.pagination.total,
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
}
