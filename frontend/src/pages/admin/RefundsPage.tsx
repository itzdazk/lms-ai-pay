import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Loader2 } from 'lucide-react'
import { adminOrdersApi } from '../../lib/api/admin-orders'
import type { Order } from '../../lib/api/types'
import {
    RefundsFilters,
    RefundsTable,
    RefundsPagination,
    RefundDialog,
    type RefundFilters,
} from '../../components/admin/refunds'
import { toast } from 'sonner'

export function RefundsPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState<RefundFilters>({
        page: 1,
        limit: 10,
        search: '',
        paymentStatus: undefined,
        sort: 'newest',
        startDate: undefined,
        endDate: undefined,
        minAmount: undefined,
        maxAmount: undefined,
    })

    // Memoize filters to prevent unnecessary re-renders
    const memoizedFilters = useMemo(
        () => filters,
        [
            filters.page,
            filters.limit,
            filters.search,
            filters.paymentStatus,
            filters.sort,
            filters.startDate,
            filters.endDate,
            filters.minAmount,
            filters.maxAmount,
        ]
    )

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
    const [searchInput, setSearchInput] = useState<string>(filters.search || '')
    const [refundAmount, setRefundAmount] = useState<string>('')
    const [refundReason, setRefundReason] = useState<string>('')
    const scrollPositionRef = useRef<number>(0)
    const isPageChangingRef = useRef<boolean>(false)

    // Check if user is admin
    useEffect(() => {
        if (authLoading) return

        if (!currentUser) {
            navigate('/login')
            return
        }

        if (currentUser.role !== 'ADMIN') {
            navigate('/dashboard')
            return
        }
    }, [currentUser, authLoading, navigate])

    // Load orders when filters change
    useEffect(() => {
        if (currentUser) {
            loadOrders()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.paymentStatus,
        filters.sort,
        filters.startDate,
        filters.endDate,
        filters.minAmount,
        filters.maxAmount,
        currentUser,
    ])

    // Restore scroll position
    useEffect(() => {
        if (isPageChangingRef.current && scrollPositionRef.current > 0) {
            const restoreScroll = () => {
                const scrollContainer = document.querySelector('main') || window
                if (scrollContainer === window) {
                    window.scrollTo({
                        top: scrollPositionRef.current,
                        behavior: 'auto',
                    })
                } else {
                    ;(scrollContainer as HTMLElement).scrollTop =
                        scrollPositionRef.current
                }
            }

            restoreScroll()
            setTimeout(restoreScroll, 0)
            requestAnimationFrame(() => {
                restoreScroll()
                isPageChangingRef.current = false
            })
        }
    }, [pagination.page])

    const loadOrders = async () => {
        try {
            setLoading(true)
            // Filter only refundable orders (PAID, PARTIALLY_REFUNDED, REFUNDED)
            const refundableStatuses = [
                'PAID',
                'PARTIALLY_REFUNDED',
                'REFUNDED',
            ]
            const statusFilter = filters.paymentStatus || undefined

            const result = await adminOrdersApi.getAllOrders({
                ...filters,
                paymentStatus: statusFilter,
            })

            // Filter orders to show only refundable ones
            const refundableOrders = result.data.filter((order: Order) =>
                refundableStatuses.includes(order.paymentStatus)
            )

            setOrders(refundableOrders)
            setPagination(result.pagination || pagination)
        } catch (error: any) {
            console.error('Error loading orders:', error)
            toast.error('Không thể tải danh sách đơn hàng')
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    // Handle search input change (no auto-search)
    const handleSearchInputChange = (value: string) => {
        setSearchInput(value)
    }

    // Handle clear search (reset both input and filters)
    const handleClearSearch = () => {
        setSearchInput('')
        setFilters((prev) => ({ ...prev, search: '', page: 1 }))
    }

    // Handle search execution (manual search)
    const handleSearch = () => {
        setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }))
    }

    // Handle search on Enter key
    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleFilterChange = useCallback(
        (key: keyof RefundFilters, value: any) => {
            const mainContainer = document.querySelector('main')
            if (mainContainer) {
                scrollPositionRef.current = (
                    mainContainer as HTMLElement
                ).scrollTop
            } else {
                scrollPositionRef.current =
                    window.scrollY || document.documentElement.scrollTop
            }
            isPageChangingRef.current = true
            setFilters((prev) => ({
                ...prev,
                [key]: value === 'all' ? undefined : value,
                page: 1,
            }))
        },
        []
    )

    const handlePageChange = useCallback((newPage: number) => {
        // Use requestAnimationFrame to avoid blocking input
        requestAnimationFrame(() => {
            const mainContainer = document.querySelector('main')
            if (mainContainer) {
                scrollPositionRef.current = (
                    mainContainer as HTMLElement
                ).scrollTop
            } else {
                scrollPositionRef.current =
                    window.scrollY || document.documentElement.scrollTop
            }
            isPageChangingRef.current = true
        })

        setFilters((prev) => ({ ...prev, page: newPage }))
    }, [])

    const handleViewDetail = (order: Order) => {
        // Navigate to order detail page
        navigate(`/orders/${order.id}`)
    }

    const handleRefund = (order: Order) => {
        setSelectedOrder(order)
        setRefundAmount('')
        setRefundReason('')
        setIsRefundDialogOpen(true)
    }

    const confirmRefund = async () => {
        if (!selectedOrder) return

        try {
            setActionLoading(true)

            const amount = parseFloat(refundAmount)
            if (isNaN(amount) || amount <= 0) {
                toast.error('Vui lòng nhập số tiền hợp lệ')
                return
            }

            const maxRefund =
                selectedOrder.finalPrice - selectedOrder.refundAmount
            if (amount > maxRefund) {
                toast.error('Số tiền hoàn vượt quá số tiền có thể hoàn')
                return
            }

            await adminOrdersApi.refundOrder(selectedOrder.id, {
                amount: amount,
                reason: refundReason.trim() || undefined,
            })

            toast.success('Hoàn tiền thành công')
            setIsRefundDialogOpen(false)
            setSelectedOrder(null)
            setRefundAmount('')
            setRefundReason('')

            // Reload orders
            await loadOrders()
        } catch (error: any) {
            console.error('Error refunding order:', error)
            toast.error(error.message || 'Không thể hoàn tiền')
        } finally {
            setActionLoading(false)
        }
    }

    const handleClearFilters = useCallback(() => {
        setSearchInput('')
        const mainContainer = document.querySelector('main')
        if (mainContainer) {
            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
        } else {
            scrollPositionRef.current =
                window.scrollY || document.documentElement.scrollTop
        }
        isPageChangingRef.current = true
        setFilters({
            page: 1,
            limit: 10,
            search: '',
            paymentStatus: undefined,
            sort: 'newest',
            startDate: undefined,
            endDate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
        })
    }, [])

    const renderPagination = () => {
        return (
            <RefundsPagination
                pagination={pagination}
                loading={loading}
                onPageChange={handlePageChange}
            />
        )
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className='container mx-auto px-4 py-4 bg-white dark:bg-black min-h-screen flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
        )
    }

    // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return null
    }

    return (
        <div className='w-full px-4 py-4 bg-white dark:bg-black min-h-screen'>
            <div className='w-full'>
                <div className='mb-6'>
                    <div className='flex items-start justify-between gap-4 mb-2'>
                        <div>
                            <h1 className='text-3xl md:text-4xl font-bold mb-2 text-black dark:text-white flex items-center gap-3'>
                                <RotateCcw className='h-8 w-8' />
                                Quản lý Hoàn tiền
                            </h1>
                            <p className='text-gray-400'>
                                Xem và xử lý các yêu cầu hoàn tiền cho đơn hàng
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <RefundsFilters
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />

                {/* Refunds Table */}
                <RefundsTable
                    orders={orders}
                    loading={loading}
                    pagination={pagination}
                    searchInput={searchInput}
                    selectedRowId={selectedRowId}
                    onSearchChange={handleSearchInputChange}
                    onSearchExecute={handleSearch}
                    onSearchKeyPress={handleSearchKeyPress}
                    onClearSearch={handleClearSearch}
                    onViewDetail={handleViewDetail}
                    onRefund={handleRefund}
                    onRowSelect={setSelectedRowId}
                    renderPagination={renderPagination}
                />

                {/* Refund Dialog */}
                <RefundDialog
                    isOpen={isRefundDialogOpen}
                    setIsOpen={setIsRefundDialogOpen}
                    selectedOrder={selectedOrder}
                    refundAmount={refundAmount}
                    setRefundAmount={setRefundAmount}
                    refundReason={refundReason}
                    setRefundReason={setRefundReason}
                    onConfirmRefund={confirmRefund}
                    actionLoading={actionLoading}
                />
            </div>
        </div>
    )
}
