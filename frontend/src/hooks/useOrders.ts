import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CreateOrderRequest, Order, OrderFilters } from '../lib/api'
import { ordersApi } from '../lib/api/orders'
import type { OrderStats } from '../components/Payment/OrderStats'

type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

const parseErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
        const anyError = error as any
        const message =
            anyError?.response?.data?.message ||
            anyError?.message ||
            'Đã xảy ra lỗi'
        return typeof message === 'string' ? message : 'Đã xảy ra lỗi'
    }
    if (typeof error === 'string') return error
    return 'Đã xảy ra lỗi'
}

/**
 * Hook: create a new order
 */
export function useCreateOrder() {
    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const createOrder = useCallback(async (payload: CreateOrderRequest) => {
        setStatus('loading')
        setError(null)
        try {
            const data = await ordersApi.createOrder(payload)
            setOrder(data)
            setStatus('success')
            return data
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
            throw err
        }
    }, [])

    const reset = useCallback(() => {
        setOrder(null)
        setStatus('idle')
        setError(null)
    }, [])

    return useMemo(
        () => ({
            order,
            status,
            isLoading: status === 'loading',
            isError: status === 'error',
            error,
            createOrder,
            reset,
        }),
        [order, status, error, createOrder, reset]
    )
}

/**
 * Hook: fetch order by ID
 */
export function useOrderById(orderId?: number | string) {
    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchOrder = useCallback(async () => {
        if (!orderId) return

        setStatus('loading')
        setError(null)
        try {
            const data = await ordersApi.getOrderById(orderId)
            setOrder(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [orderId])

    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    return {
        order,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchOrder,
    }
}

/**
 * Hook: fetch order by code (used in callback pages)
 */
export function useOrderByCode(orderCode?: string) {
    const [order, setOrder] = useState<Order | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!orderCode) return

        const fetchOrder = async () => {
            setStatus('loading')
            setError(null)
            try {
                const data = await ordersApi.getOrderByCode(orderCode)
                setOrder(data)
                setStatus('success')
            } catch (err) {
                const message = parseErrorMessage(err)
                setError(message)
                setStatus('error')
                toast.error(message)
            }
        }

        fetchOrder()
    }, [orderCode])

    return {
        order,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
    }
}

/**
 * Hook: fetch orders list with filters and pagination
 */
export function useOrders(filters?: OrderFilters) {
    const [orders, setOrders] = useState<Order[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await ordersApi.getOrders(filters)
            setOrders(data.orders)
            setPagination(data.pagination)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [filters])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    return {
        orders,
        pagination,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchOrders,
    }
}

/**
 * Hook: fetch order statistics
 */
export function useOrderStats() {
    const [stats, setStats] = useState<OrderStats | null>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await ordersApi.getOrderStats()
            setStats(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchStats,
    }
}

/**
 * Hook: cancel a pending order
 */
export function useCancelOrder() {
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const cancelOrder = useCallback(async (orderId: number | string) => {
        setStatus('loading')
        setError(null)
        try {
            const data = await ordersApi.cancelOrder(orderId)
            setStatus('success')
            toast.success('Đã hủy đơn hàng thành công')
            return data
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
            throw err
        }
    }, [])

    return {
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        cancelOrder,
    }
}
