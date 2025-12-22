import { useState, useCallback, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { OrderSummary } from '../components/Payment/OrderSummary'
import { TransactionList } from '../components/Payment/TransactionList'
import { TransactionFilters } from '../components/Payment/TransactionFilters'
import { useOrderById, useCancelOrder } from '../hooks/useOrders'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../contexts/AuthContext'
import { adminOrdersApi } from '../lib/api/admin-orders'
import type { TransactionFilters as TransactionFiltersType } from '../lib/api/transactions'
import { formatPrice } from '../lib/courseUtils'
import { formatDateTime } from '../lib/utils'
import type { PaymentTransaction, Order } from '../lib/api/types'
import { toast } from 'sonner'
import {
    ArrowLeft,
    X,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    CreditCard,
    Wallet,
    MapPin,
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    Receipt,
    History,
} from 'lucide-react'

function getStatusBadge(status: string) {
    switch (status) {
        case 'PAID':
            return (
                <Badge className='bg-green-100 text-green-700 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40 flex items-center gap-1.5'>
                    <CheckCircle className='h-3 w-3' />
                    Đã thanh toán
                </Badge>
            )
        case 'PENDING':
            return (
                <Badge className='bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-300 dark:border-yellow-500/40 flex items-center gap-1.5'>
                    <Clock className='h-3 w-3' />
                    Đang chờ
                </Badge>
            )
        case 'FAILED':
            return (
                <Badge className='bg-red-100 text-red-700 border border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:border-red-500/40 flex items-center gap-1.5'>
                    <XCircle className='h-3 w-3' />
                    Thất bại
                </Badge>
            )
        case 'REFUNDED':
            return (
                <Badge className='bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Đã hoàn tiền
                </Badge>
            )
        case 'PARTIALLY_REFUNDED':
            return (
                <Badge className='bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-600/20 dark:text-orange-300 dark:border-orange-500/40 flex items-center gap-1.5'>
                    <RefreshCw className='h-3 w-3' />
                    Hoàn tiền một phần
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500/40'>
                    {status}
                </Badge>
            )
    }
}

function getGatewayIcon(gateway: string) {
    switch (gateway) {
        case 'VNPay':
            return <CreditCard className='h-4 w-4' />
        case 'MoMo':
            return <Wallet className='h-4 w-4' />
        default:
            return <CreditCard className='h-4 w-4' />
    }
}

function getTransactionStatusText(status: string | undefined): string {
    switch (status) {
        case 'SUCCESS':
            return 'Thành công'
        case 'PENDING':
            return 'Đang chờ'
        case 'FAILED':
            return 'Thất bại'
        case 'REFUNDED':
            return 'Đã hoàn tiền'
        case 'PARTIALLY_REFUNDED':
            return 'Hoàn tiền một phần'
        default:
            return status || 'N/A'
    }
}

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const orderId = id ? parseInt(id, 10) : undefined
    const { user: currentUser } = useAuth()

    // Check if user is admin
    const isAdmin = currentUser?.role === 'ADMIN'

    // Order state (for admin, we'll fetch manually)
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Cancel order dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

    // Active tab state for transactions card
    const [activeTransactionTab, setActiveTransactionTab] = useState(
        searchParams.get('txTab') || 'order-transactions'
    )

    // Transaction detail dialog
    const [selectedTransaction, setSelectedTransaction] =
        useState<PaymentTransaction | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    // Transaction history filters (for all transactions tab)
    const [transactionFilters, setTransactionFilters] =
        useState<TransactionFiltersType>({
            page: parseInt(searchParams.get('txPage') || '1'),
            limit: 10,
            status: (searchParams.get('txStatus') as any) || undefined,
            paymentGateway: (searchParams.get('txGateway') as any) || undefined,
            startDate: searchParams.get('txStartDate') || undefined,
            endDate: searchParams.get('txEndDate') || undefined,
        })

    // Hooks - use regular hook for non-admin users
    const {
        order: regularOrder,
        isLoading: regularLoading,
        refetch: regularRefetch,
    } = useOrderById(isAdmin ? undefined : orderId)
    const { cancelOrder, isLoading: cancelLoading } = useCancelOrder()

    // Fetch order for admin
    useEffect(() => {
        if (isAdmin && orderId) {
            const fetchAdminOrder = async () => {
                try {
                    setIsLoading(true)
                    const orderData = await adminOrdersApi.getOrderById(orderId)
                    setOrder(orderData)
                } catch (error: any) {
                    console.error('Error fetching admin order:', error)
                    toast.error(
                        error?.response?.data?.message ||
                            'Không thể tải thông tin đơn hàng'
                    )
                    setOrder(null)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchAdminOrder()
        }
    }, [isAdmin, orderId])

    // Use appropriate order and loading state
    const finalOrder = isAdmin ? order : regularOrder
    const finalIsLoading = isAdmin ? isLoading : regularLoading
    const refetch = isAdmin
        ? async () => {
              if (orderId) {
                  try {
                      setIsLoading(true)
                      const orderData = await adminOrdersApi.getOrderById(orderId)
                      setOrder(orderData)
                  } catch (error: any) {
                      console.error('Error refetching admin order:', error)
                      toast.error(
                          error?.response?.data?.message ||
                              'Không thể tải thông tin đơn hàng'
                      )
                  } finally {
                      setIsLoading(false)
                  }
              }
          }
        : regularRefetch
    const {
        transactions: allTransactions,
        pagination: transactionPagination,
        isLoading: transactionsLoading,
    } = useTransactions(
        activeTransactionTab === 'all-transactions'
            ? transactionFilters
            : undefined
    )

    // Update URL when tab or filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (activeTransactionTab !== 'order-transactions') {
            params.set('txTab', activeTransactionTab)
        } else {
            params.delete('txTab')
        }

        if (activeTransactionTab === 'all-transactions') {
            if (transactionFilters.page && transactionFilters.page > 1)
                params.set('txPage', transactionFilters.page.toString())
            else params.delete('txPage')
            if (transactionFilters.status)
                params.set('txStatus', transactionFilters.status)
            else params.delete('txStatus')
            if (transactionFilters.paymentGateway)
                params.set('txGateway', transactionFilters.paymentGateway)
            else params.delete('txGateway')
            if (transactionFilters.startDate)
                params.set('txStartDate', transactionFilters.startDate)
            else params.delete('txStartDate')
            if (transactionFilters.endDate)
                params.set('txEndDate', transactionFilters.endDate)
            else params.delete('txEndDate')
        } else {
            params.delete('txPage')
            params.delete('txStatus')
            params.delete('txGateway')
            params.delete('txStartDate')
            params.delete('txEndDate')
        }

        setSearchParams(params, { replace: true })
    }, [
        activeTransactionTab,
        transactionFilters,
        searchParams,
        setSearchParams,
    ])

    // Handle cancel order
    const handleCancelClick = useCallback(() => {
        setCancelDialogOpen(true)
    }, [])

    const handleCancelConfirm = useCallback(async () => {
        if (!orderId) return

        try {
            await cancelOrder(orderId)
            setCancelDialogOpen(false)
            refetch() // Refresh order data
        } catch (error) {
            // Error is already handled in the hook
        }
    }, [orderId, cancelOrder, refetch])

    // Handle transaction filter changes
    const handleTransactionFilterChange = useCallback(
        (key: keyof TransactionFiltersType, value: any) => {
            setTransactionFilters((prev) => ({
                ...prev,
                [key]: value,
                page: 1, // Reset to first page when filter changes
            }))
        },
        []
    )

    // Handle transaction pagination
    const handleTransactionPageChange = useCallback((page: number) => {
        setTransactionFilters((prev) => ({ ...prev, page }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Handle view transaction detail
    const handleViewDetail = useCallback((transaction: PaymentTransaction) => {
        setSelectedTransaction(transaction)
        setDetailDialogOpen(true)
    }, [])

    // Clear transaction filters
    const clearTransactionFilters = useCallback(() => {
        setTransactionFilters({
            page: 1,
            limit: 10,
        })
    }, [])

    // Render transaction pagination
    const renderTransactionPagination = () => {
        if (!transactionPagination || transactionPagination.totalPages <= 1)
            return null

        const pages: (number | string)[] = []
        const totalPages = transactionPagination.totalPages
        const currentPage = transactionPagination.page

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
                    onClick={() => handleTransactionPageChange(1)}
                    disabled={currentPage === 1 || transactionsLoading}
                    size='sm'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handleTransactionPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || transactionsLoading}
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
                            onClick={() => handleTransactionPageChange(pageNum)}
                            disabled={transactionsLoading}
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
                    onClick={() => handleTransactionPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || transactionsLoading}
                    size='sm'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handleTransactionPageChange(totalPages)}
                    disabled={currentPage === totalPages || transactionsLoading}
                    size='sm'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
    }

    // Loading state
    if (finalIsLoading) {
        return (
            <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
                <div className='mb-6'>
                    <Skeleton className='h-8 w-48 mb-2' />
                    <Skeleton className='h-4 w-64' />
                </div>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2'>
                        <Card>
                            <CardHeader>
                                <Skeleton className='h-6 w-32' />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='h-64 w-full' />
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Skeleton className='h-96 w-full' />
                    </div>
                </div>
            </div>
        )
    }

    // Error state
    if (!finalOrder) {
        return (
            <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
                <div className='text-center py-12'>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                        Không tìm thấy đơn hàng
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400 mb-6'>
                        Đơn hàng không tồn tại hoặc bạn không có quyền xem.
                    </p>
                    <DarkOutlineButton asChild>
                        <Link to={isAdmin ? '/admin/orders' : '/orders'}>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            {isAdmin ? 'Quay lại quản lý đơn hàng' : 'Quay lại lịch sử đơn hàng'}
                        </Link>
                    </DarkOutlineButton>
                </div>
            </div>
        )
    }

    const transactions = finalOrder.paymentTransactions || []
    const course = finalOrder.course

    return (
        <div className='container mx-auto px-4 py-8 bg-background min-h-screen'>
            {/* Header */}
            <div className='mb-6'>
                <DarkOutlineButton asChild variant='ghost' className='mb-4'>
                    <Link to={isAdmin ? '/admin/orders' : '/orders'}>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        {isAdmin ? 'Quay lại quản lý đơn hàng' : 'Quay lại lịch sử đơn hàng'}
                    </Link>
                </DarkOutlineButton>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                            Chi tiết đơn hàng
                        </h1>
                        <p className='text-gray-600 dark:text-gray-400'>
                            Mã đơn:{' '}
                            <span className='font-mono'>{finalOrder.orderCode}</span>
                        </p>
                    </div>
                    {finalOrder.paymentStatus === 'PENDING' && (
                        <Button
                            variant='outline'
                            className='border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                            onClick={handleCancelClick}
                            disabled={cancelLoading}
                        >
                            {cancelLoading ? (
                                <>
                                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2' />
                                    Đang hủy...
                                </>
                            ) : (
                                <>
                                    <X className='mr-2 h-4 w-4' />
                                    Hủy đơn hàng
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Main Content */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Order Info */}
                    <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-gray-900 dark:text-white'>
                                Thông tin đơn hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Trạng thái
                                    </p>
                                    <div>
                                        {getStatusBadge(finalOrder.paymentStatus)}
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Phương thức thanh toán
                                    </p>
                                    <Badge
                                        variant='outline'
                                        className='border-gray-300 text-gray-700 dark:border-[#2D2D2D] dark:text-gray-300 flex items-center gap-1.5 w-fit'
                                    >
                                        {getGatewayIcon(finalOrder.paymentGateway)}
                                        {finalOrder.paymentGateway}
                                    </Badge>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                        Ngày tạo
                                    </p>
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-1.5'>
                                        <Calendar className='h-4 w-4' />
                                        {formatDateTime(finalOrder.createdAt)}
                                    </p>
                                </div>
                                {finalOrder.paidAt && (
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                                            Ngày thanh toán
                                        </p>
                                        <p className='text-sm text-gray-900 dark:text-white flex items-center gap-1.5'>
                                            <Calendar className='h-4 w-4' />
                                            {formatDateTime(finalOrder.paidAt)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />

                            <div className='space-y-2'>
                                <div className='flex justify-between text-gray-600 dark:text-gray-400'>
                                    <span>Giá gốc:</span>
                                    <span>
                                        {formatPrice(finalOrder.originalPrice)}
                                    </span>
                                </div>
                                {finalOrder.discountAmount > 0 && (
                                    <div className='flex justify-between text-green-500'>
                                        <span>Giảm giá:</span>
                                        <span>
                                            -{formatPrice(finalOrder.discountAmount)}
                                        </span>
                                    </div>
                                )}
                                <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                <div className='flex justify-between items-center'>
                                    <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                                        Tổng cộng:
                                    </span>
                                    <span className='text-xl font-bold text-blue-600 dark:text-blue-500'>
                                        {formatPrice(finalOrder.finalPrice)}
                                    </span>
                                </div>
                            </div>

                            {finalOrder.refundAmount > 0 && (
                                <>
                                    <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                    <div className='flex justify-between text-purple-500'>
                                        <span>Đã hoàn tiền:</span>
                                        <span className='font-semibold'>
                                            {formatPrice(finalOrder.refundAmount)}
                                        </span>
                                    </div>
                                    {finalOrder.refundedAt && (
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                            Ngày hoàn tiền:{' '}
                                            {formatDateTime(finalOrder.refundedAt)}
                                        </p>
                                    )}
                                </>
                            )}

                            {finalOrder.notes && (
                                <>
                                    <Separator className='bg-gray-300 dark:bg-[#2D2D2D]' />
                                    <div>
                                        <p className='text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5'>
                                            <FileText className='h-4 w-4' />
                                            Ghi chú
                                        </p>
                                        <p className='text-sm text-gray-900 dark:text-white'>
                                            {finalOrder.notes}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Billing Address */}
                    {finalOrder.billingAddress && (
                        <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-gray-900 dark:text-white flex items-center gap-2'>
                                    <MapPin className='h-5 w-5' />
                                    Địa chỉ thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-2'>
                                {finalOrder.billingAddress.fullName && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <User className='h-4 w-4 text-gray-500' />
                                        {finalOrder.billingAddress.fullName}
                                    </p>
                                )}
                                {finalOrder.billingAddress.email && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <Mail className='h-4 w-4 text-gray-500' />
                                        {finalOrder.billingAddress.email}
                                    </p>
                                )}
                                {finalOrder.billingAddress.phone && (
                                    <p className='text-sm text-gray-900 dark:text-white flex items-center gap-2'>
                                        <Phone className='h-4 w-4 text-gray-500' />
                                        {finalOrder.billingAddress.phone}
                                    </p>
                                )}
                                {finalOrder.billingAddress.address && (
                                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                                        {finalOrder.billingAddress.address}
                                        {finalOrder.billingAddress.city &&
                                            `, ${finalOrder.billingAddress.city}`}
                                        {finalOrder.billingAddress.country &&
                                            `, ${finalOrder.billingAddress.country}`}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Transactions Card with Tabs */}
                    <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-gray-900 dark:text-white'>
                                Giao dịch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs
                                value={activeTransactionTab}
                                onValueChange={setActiveTransactionTab}
                                className='w-full'
                            >
                                <TabsList className='w-full justify-start bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-[#2D2D2D]'>
                                    <TabsTrigger
                                        value='order-transactions'
                                        className='flex items-center gap-2'
                                    >
                                        <Receipt className='h-4 w-4' />
                                        Giao dịch của đơn hàng này
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value='all-transactions'
                                        className='flex items-center gap-2'
                                    >
                                        <History className='h-4 w-4' />
                                        Lịch sử toàn bộ giao dịch
                                    </TabsTrigger>
                                </TabsList>

                                {/* Order Transactions Tab */}
                                <TabsContent
                                    value='order-transactions'
                                    className='space-y-4 mt-6'
                                >
                                    <CardDescription className='text-gray-600 dark:text-gray-400'>
                                        {transactions.length > 0
                                            ? `${transactions.length} giao dịch`
                                            : 'Chưa có giao dịch nào'}
                                    </CardDescription>
                                    <TransactionList
                                        transactions={transactions}
                                        loading={false}
                                        onTransactionClick={handleViewDetail}
                                    />
                                </TabsContent>

                                {/* All Transactions Tab */}
                                <TabsContent
                                    value='all-transactions'
                                    className='space-y-6 mt-6'
                                >
                                    {/* Transactions Table */}
                                    <TransactionList
                                        transactions={allTransactions}
                                        loading={transactionsLoading}
                                        onTransactionClick={handleViewDetail}
                                    />

                                    {/* Pagination */}
                                    {renderTransactionPagination()}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className='space-y-6'>
                    {/* Order Summary */}
                    <OrderSummary course={course || null} loading={false} />

                    {/* Actions */}
                    {course && (
                        <Card className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-gray-900 dark:text-white'>
                                    Thao tác
                                </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                                {finalOrder.paymentStatus === 'PAID' && course && (
                                    <DarkOutlineButton
                                        asChild
                                        className='w-full'
                                    >
                                        <Link
                                            to={`/courses/${
                                                course.slug || course.id
                                            }`}
                                        >
                                            Vào học ngay
                                        </Link>
                                    </DarkOutlineButton>
                                )}
                                {finalOrder.paymentStatus === 'FAILED' && course && (
                                    <DarkOutlineButton
                                        asChild
                                        className='w-full'
                                    >
                                        <Link to={`/checkout/${course.id}`}>
                                            Thử lại thanh toán
                                        </Link>
                                    </DarkOutlineButton>
                                )}
                                <DarkOutlineButton
                                    asChild
                                    variant='outline'
                                    className='w-full'
                                >
                                    <Link to={isAdmin ? '/admin/orders' : '/orders'}>
                                        {isAdmin ? 'Quản lý đơn hàng' : 'Xem tất cả đơn hàng'}
                                    </Link>
                                </DarkOutlineButton>
                                <DarkOutlineButton
                                    asChild
                                    variant='outline'
                                    className='w-full'
                                >
                                    <Link
                                        to='/transactions'
                                        className='flex items-center justify-center gap-2'
                                    >
                                        <History className='h-4 w-4' />
                                        Xem toàn bộ lịch sử giao dịch
                                    </Link>
                                </DarkOutlineButton>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className='bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-[#2D2D2D] text-gray-900 dark:text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                        <DialogDescription className='text-gray-600 dark:text-gray-400'>
                            Bạn có chắc chắn muốn hủy đơn hàng{' '}
                            <span className='font-mono font-semibold'>
                                {finalOrder.orderCode}
                            </span>
                            ? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setCancelDialogOpen(false)}
                            className='border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            disabled={cancelLoading}
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            {cancelLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                                : selectedTransaction.status ===
                                                  'REFUNDED'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40'
                                                : selectedTransaction.status ===
                                                  'PARTIALLY_REFUNDED'
                                                ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-600/20 dark:text-orange-300 dark:border-orange-500/40'
                                                : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500/40'
                                        }
                                    >
                                        {getTransactionStatusText(
                                            selectedTransaction.status
                                        )}
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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
