import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CreateOrderRequest, Order } from '../lib/api'
import { ordersApi } from '../lib/api/orders'

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

    useEffect(() => {
        if (!orderId) return

        const fetchOrder = async () => {
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
        }

        fetchOrder()
    }, [orderId])

    return {
        order,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
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
