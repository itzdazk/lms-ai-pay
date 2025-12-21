import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { PaymentTransaction } from '../lib/api/types'
import { transactionsApi } from '../lib/api/transactions'
import type { TransactionFilters } from '../lib/api/transactions'

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
 * Hook: fetch transactions list with filters and pagination
 */
export function useTransactions(filters?: TransactionFilters) {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const data = await transactionsApi.getTransactions(filters)
            setTransactions(data.transactions)
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
        fetchTransactions()
    }, [fetchTransactions])

    return {
        transactions,
        pagination,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchTransactions,
    }
}

/**
 * Hook: fetch transaction by ID
 */
export function useTransactionById(transactionId?: number | string) {
    const [transaction, setTransaction] = useState<PaymentTransaction | null>(
        null
    )
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [error, setError] = useState<string | null>(null)

    const fetchTransaction = useCallback(async () => {
        if (!transactionId) return

        setStatus('loading')
        setError(null)
        try {
            const data = await transactionsApi.getTransactionById(transactionId)
            setTransaction(data)
            setStatus('success')
        } catch (err) {
            const message = parseErrorMessage(err)
            setError(message)
            setStatus('error')
            toast.error(message)
        }
    }, [transactionId])

    useEffect(() => {
        fetchTransaction()
    }, [fetchTransaction])

    return {
        transaction,
        status,
        isLoading: status === 'loading',
        isError: status === 'error',
        error,
        refetch: fetchTransaction,
    }
}
