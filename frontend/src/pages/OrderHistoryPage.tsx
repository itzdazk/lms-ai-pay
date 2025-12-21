import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { OrderStats } from '../components/Payment/OrderStats'
import { OrderTable } from '../components/Payment/OrderTable'
import {
    OrderFilters,
    type OrderFilters as OrderFiltersType,
} from '../components/Payment/OrderFilters'
import { useOrders, useOrderStats, useCancelOrder } from '../hooks/useOrders'

export function OrderHistoryPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Filters state
    const [filters, setFilters] = useState<OrderFiltersType>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        paymentStatus: (searchParams.get('paymentStatus') as any) || undefined,
        paymentGateway:
            (searchParams.get('paymentGateway') as any) || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        sort: (searchParams.get('sort') as any) || 'newest',
        search: searchParams.get('search') || undefined,
    })

    // Cancel order state
    const [orderToCancel, setOrderToCancel] = useState<number | null>(null)

    // Hooks
    const { orders, pagination, isLoading, refetch } = useOrders(filters)
    const { stats, isLoading: statsLoading } = useOrderStats()
    const { cancelOrder, isLoading: cancelLoading } = useCancelOrder()

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.page && filters.page > 1)
            params.set('page', filters.page.toString())
        if (filters.paymentStatus)
            params.set('paymentStatus', filters.paymentStatus)
        if (filters.paymentGateway)
            params.set('paymentGateway', filters.paymentGateway)
        if (filters.startDate) params.set('startDate', filters.startDate)
        if (filters.endDate) params.set('endDate', filters.endDate)
        if (filters.sort && filters.sort !== 'newest')
            params.set('sort', filters.sort)
        if (filters.search) params.set('search', filters.search)

        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (key: keyof OrderFiltersType, value: any) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
                page: 1, // Reset to first page when filter changes
            }))
        },
        []
    )

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, page }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Handle cancel order - called from OrderTable dialog
    const handleCancelOrder = useCallback(
        async (orderId: number) => {
            setOrderToCancel(orderId)
            try {
                await cancelOrder(orderId)
                setOrderToCancel(null)
                refetch() // Refresh orders list
            } catch (error) {
                // Error is already handled in the hook
                setOrderToCancel(null)
            }
        },
        [cancelOrder, refetch]
    )

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
            sort: 'newest',
        })
    }, [])

    // Render pagination
    const renderPagination = () => {
        const pages: (number | string)[] = []
        const totalPages = pagination.totalPages
        const currentPage = pagination.page

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            if (currentPage > 3) {
                pages.push('...')
            }
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            pages.push(totalPages)
        }

        return (
            <div className='flex items-center justify-center gap-2 flex-wrap mt-6'>
                <DarkOutlineButton
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;
                </DarkOutlineButton>
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-500'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNum = page as number
                    return (
                        <DarkOutlineButton
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            size='sm'
                            className={
                                currentPage === pageNum
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNum}
                        </DarkOutlineButton>
                    )
                })}
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
            <div className='mb-6'>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                    Lịch sử đơn hàng
                </h1>
                <p className='text-gray-600 dark:text-gray-400'>
                    Xem và quản lý tất cả đơn hàng của bạn
                </p>
            </div>

            {/* Stats */}
            <OrderStats stats={stats} loading={statsLoading} />

            {/* Filters */}
            <OrderFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                totalResults={pagination.total}
            />

            {/* Orders Table */}
            <OrderTable
                orders={orders}
                loading={isLoading}
                onCancel={handleCancelOrder}
                cancelLoading={cancelLoading ? orderToCancel : null}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && renderPagination()}
        </div>
    )
}
