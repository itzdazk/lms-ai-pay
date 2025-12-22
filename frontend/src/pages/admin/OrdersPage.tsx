import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Loader2, History } from 'lucide-react'
import {
    adminOrdersApi,
    type AdminOrderFilters,
    type AdminOrderStats,
} from '../../lib/api/admin-orders'
import { toast } from 'sonner'
import type { Order } from '../../lib/api/types'
import {
    OrdersStats,
    OrdersFilters,
    OrdersTable,
    OrdersPagination,
    OrderDialogs,
} from '../../components/admin/orders'
import { DarkOutlineButton } from '../../components/ui/buttons'

export function OrdersPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    const [stats, setStats] = useState<AdminOrderStats | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState<AdminOrderFilters>({
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

    // Load stats on mount
    useEffect(() => {
        if (currentUser) {
            loadStats()
        }
    }, [currentUser])

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
            const result = await adminOrdersApi.getAllOrders(filters)
            setOrders(result.data || [])
            setPagination(result.pagination || pagination)
        } catch (error: any) {
            console.error('Error loading orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            setStatsLoading(true)
            const statsData = await adminOrdersApi.getOrderStats()
            setStats(statsData)
        } catch (error: any) {
            console.error('Error loading order stats:', error)
        } finally {
            setStatsLoading(false)
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
        (key: keyof AdminOrderFilters, value: any) => {
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
        // Navigate to order detail page or open modal
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
                toast.error(
                    `Số tiền hoàn lại không được vượt quá ${maxRefund.toLocaleString(
                        'vi-VN'
                    )} VND`
                )
                return
            }

            await adminOrdersApi.refundOrder(selectedOrder.id, {
                amount: amount,
                reason: refundReason.trim() || undefined,
            })

            toast.success('Hoàn tiền thành công!')
            setIsRefundDialogOpen(false)
            setSelectedOrder(null)
            setRefundAmount('')
            setRefundReason('')

            // Reload orders and stats
            await Promise.all([loadOrders(), loadStats()])
        } catch (error: any) {
            console.error('Error refunding order:', error)
            toast.error(
                error?.response?.data?.message || 'Không thể hoàn tiền đơn hàng'
            )
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
            <OrdersPagination
                pagination={pagination}
                loading={loading}
                onPageChange={handlePageChange}
            />
        )
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className='container mx-auto px-4 py-4 bg-background text-foreground min-h-screen flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
        )
    }

    // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return null
    }

    return (
        <div className='w-full px-4 py-4 bg-background text-foreground min-h-screen'>
            <div className='w-full'>
                <div className='mb-6'>
                    <div className='flex items-start justify-between gap-4 mb-2'>
                        <div>
                            <h1 className='text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3'>
                                <ShoppingCart className='h-8 w-8' />
                                Quản lý Đơn hàng
                            </h1>
                            <p className='text-muted-foreground'>
                                Xem và quản lý tất cả đơn hàng trong hệ thống
                            </p>
                        </div>
                        <DarkOutlineButton
                            asChild
                            variant='outline'
                            className='shrink-0'
                        >
                            <Link
                                to='/transactions'
                                className='flex items-center justify-center gap-2'
                            >
                                <History className='h-4 w-4' />
                                Xem toàn bộ lịch sử giao dịch
                            </Link>
                        </DarkOutlineButton>
                    </div>
                </div>

                {/* Stats */}
                <OrdersStats loading={statsLoading} stats={stats} />

                {/* Filters */}
                <OrdersFilters
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />

                {/* Orders Table */}
                <OrdersTable
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

                {/* Dialogs */}
                <OrderDialogs
                    isRefundDialogOpen={isRefundDialogOpen}
                    setIsRefundDialogOpen={setIsRefundDialogOpen}
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
