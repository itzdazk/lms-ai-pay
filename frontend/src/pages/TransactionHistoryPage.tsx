import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { TransactionList } from '../components/Payment/TransactionList'
import { TransactionFilters } from '../components/Payment/TransactionFilters'
import type { TransactionFilters as TransactionFiltersType } from '../lib/api/transactions'
import { useTransactions } from '../hooks/useTransactions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { formatPrice } from '../lib/courseUtils'
import { formatDateTime } from '../lib/utils'
import type { PaymentTransaction } from '../lib/api/types'

export function TransactionHistoryPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Filters state
    const [filters, setFilters] = useState<TransactionFiltersType>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        status: (searchParams.get('status') as any) || undefined,
        paymentGateway:
            (searchParams.get('paymentGateway') as any) || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
    })

    // Transaction detail dialog
    const [selectedTransaction, setSelectedTransaction] =
        useState<PaymentTransaction | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    // Hooks
    const { transactions, pagination, isLoading } = useTransactions(filters)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.page && filters.page > 1)
            params.set('page', filters.page.toString())
        if (filters.status) params.set('status', filters.status)
        if (filters.paymentGateway)
            params.set('paymentGateway', filters.paymentGateway)
        if (filters.startDate) params.set('startDate', filters.startDate)
        if (filters.endDate) params.set('endDate', filters.endDate)

        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (key: keyof TransactionFiltersType, value: any) => {
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

    // Handle view transaction detail
    const handleViewDetail = useCallback((transaction: PaymentTransaction) => {
        setSelectedTransaction(transaction)
        setDetailDialogOpen(true)
    }, [])

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
        })
    }, [])

    // Render pagination
    const renderPagination = () => {
        if (!pagination) return null

        const pages: (number | string)[] = []
        const totalPages = pagination.totalPages || 0
        const currentPage = pagination.page || 1

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
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
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
                    Lịch sử giao dịch
                </h1>
                <p className='text-gray-600 dark:text-gray-400'>
                    Xem và quản lý tất cả giao dịch thanh toán của bạn
                </p>
            </div>

            {/* Filters */}
            <TransactionFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                totalResults={pagination?.total || 0}
            />

            {/* Transactions Table */}
            {isLoading ? (
                <div className='rounded-lg border border-gray-300 dark:border-[#2D2D2D] overflow-hidden'>
                    <div className='p-6 space-y-4'>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className='h-16 w-full' />
                        ))}
                    </div>
                </div>
            ) : (
                <div className='rounded-lg border border-gray-300 dark:border-[#2D2D2D] overflow-hidden'>
                    <TransactionList
                        transactions={transactions}
                        loading={false}
                        onTransactionClick={handleViewDetail}
                    />
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && renderPagination()}

            {/* Transaction Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D] text-gray-900 dark:text-white max-w-2xl max-h-[80vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Chi tiết giao dịch</DialogTitle>
                        <DialogDescription className='text-gray-600 dark:text-gray-400'>
                            Thông tin chi tiết về giao dịch thanh toán
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className='space-y-4 mt-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        ID Giao dịch
                                    </p>
                                    <p className='font-mono text-sm text-gray-900 dark:text-white'>
                                        #{selectedTransaction.id}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Mã giao dịch
                                    </p>
                                    <p className='font-mono text-sm text-gray-900 dark:text-white'>
                                        {selectedTransaction.transactionId ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Phương thức
                                    </p>
                                    <Badge variant='outline'>
                                        {selectedTransaction.paymentGateway}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Trạng thái
                                    </p>
                                    <Badge
                                        className={
                                            selectedTransaction.status ===
                                            'SUCCESS'
                                                ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40'
                                                : selectedTransaction.status ===
                                                  'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-300 dark:border-yellow-500/40'
                                                : selectedTransaction.status ===
                                                  'FAILED'
                                                ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:border-red-500/40'
                                                : 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40'
                                        }
                                    >
                                        {selectedTransaction.status || 'N/A'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Số tiền
                                    </p>
                                    <p className='font-semibold text-gray-900 dark:text-white'>
                                        {formatPrice(
                                            typeof selectedTransaction.amount ===
                                                'string'
                                                ? parseFloat(
                                                      selectedTransaction.amount
                                                  )
                                                : selectedTransaction.amount
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Đơn hàng
                                    </p>
                                    {selectedTransaction.order ? (
                                        <Link
                                            to={`/orders/${selectedTransaction.order.id}`}
                                            className='text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm'
                                        >
                                            {selectedTransaction.order
                                                .orderCode || 'N/A'}
                                        </Link>
                                    ) : (
                                        <p className='text-sm text-gray-900 dark:text-white'>
                                            N/A
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Ngày tạo
                                    </p>
                                    <p className='text-sm text-gray-900 dark:text-white'>
                                        {formatDateTime(
                                            selectedTransaction.createdAt
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Cập nhật lần cuối
                                    </p>
                                    <p className='text-sm text-gray-900 dark:text-white'>
                                        {formatDateTime(
                                            selectedTransaction.updatedAt
                                        )}
                                    </p>
                                </div>
                                {selectedTransaction.ipAddress && (
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                            IP Address
                                        </p>
                                        <p className='font-mono text-sm text-gray-900 dark:text-white'>
                                            {selectedTransaction.ipAddress}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedTransaction.errorMessage && (
                                <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                                    <p className='text-sm font-semibold text-red-800 dark:text-red-300 mb-1'>
                                        Lỗi:
                                    </p>
                                    <p className='text-sm text-red-700 dark:text-red-400'>
                                        {selectedTransaction.errorMessage}
                                    </p>
                                </div>
                            )}

                            {selectedTransaction.gatewayResponse && (
                                <div>
                                    <p className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                                        Gateway Response:
                                    </p>
                                    <pre className='p-4 bg-gray-50 dark:bg-[#1F1F1F] border border-gray-300 dark:border-[#2D2D2D] rounded-lg overflow-x-auto text-xs'>
                                        {JSON.stringify(
                                            selectedTransaction.gatewayResponse,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
