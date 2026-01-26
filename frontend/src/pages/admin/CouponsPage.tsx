import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Percent } from 'lucide-react'
import { DarkOutlineButton } from '../../components/ui/buttons'
import { adminCouponsApi } from '../../lib/api/admin-coupons'
import type { Coupon, CouponFilters } from '../../lib/api/types'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import {
    CouponStats,
    CouponFilters as CouponFiltersComponent,
    CouponTable,
    CouponDialogs,
} from '../../components/admin/coupons'

export function CouponsPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState<CouponFilters>({
        page: 1,
        limit: 10,
        search: '',
        active: undefined,
        type: undefined,
        sort: 'newest',
    })

    // Memoize filters to prevent unnecessary re-renders
    const memoizedFilters = useMemo(
        () => filters,
        [
            filters.page,
            filters.limit,
            filters.search,
            filters.active,
            filters.type,
            filters.sort,
        ],
    )

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [isUsageHistoryOpen, setIsUsageHistoryOpen] = useState(false)
    const [selectedCouponId, setSelectedCouponId] = useState<number | null>(
        null,
    )
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [togglingId, setTogglingId] = useState<number | null>(null)
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

    // Load coupons when filters change
    useEffect(() => {
        if (currentUser) {
            fetchCoupons()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.active,
        filters.type,
        filters.sort,
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

    const fetchCoupons = async () => {
        try {
            setLoading(true)
            const result = await adminCouponsApi.getCoupons(filters)
            setCoupons(result.coupons)
            setTotal(result.pagination.total)
            setPagination(result.pagination)
        } catch (error) {
            console.error('Error fetching coupons:', error)
            toast.error('Không thể tải danh sách mã giảm giá')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (couponId: number) => {
        setDeleteId(couponId)
        setIsDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            const result = await adminCouponsApi.deleteCoupon(deleteId)
            toast.success(result.message)
            setIsDeleteOpen(false)
            setDeleteId(null)
            fetchCoupons()
        } catch (error) {
            console.error('Error deleting coupon:', error)
            toast.error('Không thể xóa mã giảm giá')
            setIsDeleteOpen(false)
            setDeleteId(null)
        }
    }

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon)
        setIsFormOpen(true)
    }

    const handleFormClose = () => {
        setIsFormOpen(false)
        setEditingCoupon(null)
    }

    const handleFormSuccess = () => {
        fetchCoupons()
        handleFormClose()
    }

    const handleViewUsageHistory = (couponId: number) => {
        setSelectedCouponId(couponId)
        setIsUsageHistoryOpen(true)
    }

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            setTogglingId(id)
            await adminCouponsApi.toggleCouponActive(id)

            // Update local state to reflect change immediately
            setCoupons((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, active: !c.active } : c,
                ),
            )

            toast.success(
                `Đã ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} mã giảm giá`,
            )
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái hoạt động')
        } finally {
            setTogglingId(null)
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
        (key: keyof CouponFilters, value: any) => {
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
        [],
    )

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
            active: undefined,
            type: undefined,
            sort: 'newest',
        })
    }, [])

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

    const renderPagination = () => {
        const currentPage = pagination.page
        const totalPages = pagination.totalPages
        const pages: (number | string)[] = []

        // Calculate range: show 5 pages around current page (2 before, current, 2 after)
        let startPage = Math.max(1, currentPage - 2)
        let endPage = Math.min(totalPages, currentPage + 2)

        // Adjust if we're near the start
        if (currentPage <= 3) {
            startPage = 1
            endPage = Math.min(5, totalPages)
        }

        // Adjust if we're near the end
        if (currentPage >= totalPages - 2) {
            startPage = Math.max(1, totalPages - 4)
            endPage = totalPages
        }

        // Always show first page if not in range
        if (startPage > 1) {
            pages.push(1)
            if (startPage > 2) {
                pages.push('...')
            }
        }

        // Add pages in range
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        // Always show last page if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('...')
            }
            pages.push(totalPages)
        }

        return (
            <div className='flex items-center justify-center gap-1 mt-6'>
                <DarkOutlineButton
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    size='sm'
                    className='min-w-[40px] h-9'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    size='sm'
                    className='min-w-[40px] h-9'
                >
                    &lt;
                </DarkOutlineButton>

                {/* Page Numbers */}
                <div className='flex items-center gap-1'>
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
                                disabled={loading}
                                size='sm'
                                className={
                                    pagination.page === pageNum
                                        ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                        : ''
                                }
                            >
                                {pageNum}
                            </DarkOutlineButton>
                        )
                    })}
                </div>

                <DarkOutlineButton
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    size='sm'
                    className='min-w-[40px] h-9'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(totalPages)}
                    disabled={pagination.page === totalPages}
                    size='sm'
                    className='min-w-[40px] h-9'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
                    <p className='text-muted-foreground'>Đang tải...</p>
                </div>
            </div>
        )
    }

    // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return null
    }

    return (
        <div className='w-full bg-white dark:bg-black min-h-screen'>
            <div className='w-full'>
                <div className='mb-6'>
                    <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                        <Percent className='h-6 w-6' />
                        Quản lý Mã giảm giá
                    </h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Xem và quản lý các mã giảm giá
                    </p>
                </div>

                {/* Stats Cards */}
                <CouponStats coupons={coupons} total={total} />

                {/* Filters */}
                <CouponFiltersComponent
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />

                {/* Table */}
                <CouponTable
                    coupons={coupons}
                    loading={loading}
                    pagination={pagination}
                    searchInput={searchInput}
                    togglingId={togglingId}
                    onSearchChange={handleSearchInputChange}
                    onSearchExecute={handleSearch}
                    onSearchKeyPress={handleSearchKeyPress}
                    onClearSearch={handleClearSearch}
                    onCreateNew={() => setIsFormOpen(true)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onViewUsageHistory={handleViewUsageHistory}
                    renderPagination={renderPagination}
                />

                {/* Dialogs */}
                <CouponDialogs
                    isFormOpen={isFormOpen}
                    editingCoupon={editingCoupon}
                    onFormClose={handleFormClose}
                    onFormSuccess={handleFormSuccess}
                    isUsageHistoryOpen={isUsageHistoryOpen}
                    selectedCouponId={selectedCouponId}
                    onUsageHistoryClose={() => setIsUsageHistoryOpen(false)}
                    isDeleteOpen={isDeleteOpen}
                    onDeleteClose={() => setIsDeleteOpen(false)}
                    onConfirmDelete={confirmDelete}
                />
            </div>
        </div>
    )
}
