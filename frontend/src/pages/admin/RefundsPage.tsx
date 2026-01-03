import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Loader2 } from 'lucide-react'
import {
    refundRequestsApi,
    type RefundRequest,
} from '../../lib/api/refund-requests'
import {
    RefundsFilters,
    RefundsTable,
    RefundsPagination,
    RefundRequestDetailDialog,
    type RefundFilters,
} from '../../components/admin/refunds'
import { toast } from 'sonner'

export function RefundsPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
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
        status: undefined,
        sort: 'oldest',
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
            filters.status,
            filters.sort,
            filters.startDate,
            filters.endDate,
            filters.minAmount,
            filters.maxAmount,
        ]
    )

    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
    const [selectedRefundRequest, setSelectedRefundRequest] =
        useState<RefundRequest | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [searchInput, setSearchInput] = useState<string>(filters.search || '')
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

    // Load refund requests when filters change
    useEffect(() => {
        if (currentUser) {
            loadRefundRequests()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.status,
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

    const loadRefundRequests = async () => {
        try {
            setLoading(true)

            const result = await refundRequestsApi.getAllRefundRequests({
                page: filters.page,
                limit: filters.limit,
                status: filters.status as
                    | 'PENDING'
                    | 'APPROVED'
                    | 'REJECTED'
                    | undefined,
                search: filters.search,
                sort:
                    filters.sort === 'newest' || filters.sort === 'oldest'
                        ? filters.sort
                        : 'oldest',
            })

            setRefundRequests(result.data)
            setPagination(result.pagination || pagination)
        } catch (error: any) {
            console.error('Error loading refund requests:', error)
            toast.error('Không thể tải danh sách yêu cầu hoàn tiền')
            setRefundRequests([])
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
        setFilters((prev) => ({
            ...prev,
            search: '',
            page: 1,
            status: undefined,
        }))
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

    const handleViewDetail = (refundRequest: RefundRequest) => {
        // Open detail dialog instead of navigating
        setSelectedRefundRequest(refundRequest)
        setIsDetailDialogOpen(true)
    }

    const handleRefund = (refundRequest: RefundRequest) => {
        // Open detail dialog which now has process buttons
        setSelectedRefundRequest(refundRequest)
        setIsDetailDialogOpen(true)
    }

    const handleProcessRefundRequest = async (
        requestId: number,
        action: 'APPROVE' | 'REJECT',
        customAmount?: number,
        notes?: string
    ) => {
        try {
            setActionLoading(true)

            await refundRequestsApi.processRefundRequest(
                requestId,
                action,
                customAmount,
                notes
            )

            toast.success(
                action === 'APPROVE'
                    ? 'Yêu cầu hoàn tiền đã được duyệt thành công'
                    : 'Yêu cầu hoàn tiền đã bị từ chối'
            )

            setIsDetailDialogOpen(false)
            setSelectedRefundRequest(null)

            // Reload refund requests
            await loadRefundRequests()
        } catch (error: any) {
            console.error('Error processing refund request:', error)
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    'Không thể xử lý yêu cầu hoàn tiền'
            )
            throw error
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
            status: undefined,
            sort: 'oldest',
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
                    refundRequests={refundRequests}
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

                {/* Refund Request Detail Dialog */}
                <RefundRequestDetailDialog
                    isOpen={isDetailDialogOpen}
                    setIsOpen={setIsDetailDialogOpen}
                    refundRequest={selectedRefundRequest}
                    onProcessRequest={handleProcessRefundRequest}
                    processing={actionLoading}
                />
            </div>
        </div>
    )
}
