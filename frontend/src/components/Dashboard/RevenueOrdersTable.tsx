import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../ui/dark-outline-table'
import { Skeleton } from '../ui/skeleton'
import type { Order } from '../../lib/api/types'
import { formatPrice } from '../../lib/courseUtils'
import { formatDateTime } from '../../lib/utils'

interface RevenueOrdersTableProps {
    orders: Order[]
    totalRevenue: number
    loading?: boolean
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export function RevenueOrdersTable({
    orders,
    totalRevenue,
    loading = false,
    pagination,
}: RevenueOrdersTableProps) {
    if (loading) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
                <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                        <DarkOutlineTableRow>
                            <DarkOutlineTableHead className='w-[180px]'>
                                Mã đơn
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='min-w-[250px]'>
                                Khóa học
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[200px]'>
                                Học viên
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[150px] text-right'>
                                Doanh thu
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[180px]'>
                                Ngày thanh toán
                            </DarkOutlineTableHead>
                        </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <DarkOutlineTableRow key={i}>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-32' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <div className='flex items-center gap-3'>
                                        <Skeleton className='h-10 w-16 shrink-0' />
                                        <div className='flex-1'>
                                            <Skeleton className='h-4 w-40 mb-2' />
                                        </div>
                                    </div>
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-32' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='text-right'>
                                    <Skeleton className='h-4 w-24 ml-auto' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-32' />
                                </DarkOutlineTableCell>
                            </DarkOutlineTableRow>
                        ))}
                    </DarkOutlineTableBody>
                </DarkOutlineTable>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
                <div className='p-12 text-center'>
                    <p className='text-gray-400 mb-2'>Chưa có đơn hàng nào</p>
                    <p className='text-sm text-gray-500'>
                        Không có đơn hàng đã thanh toán trong khoảng thời gian đã chọn
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
            <DarkOutlineTable>
                <DarkOutlineTableHeader>
                    <DarkOutlineTableRow>
                        <DarkOutlineTableHead className='w-[180px]'>
                            Mã đơn
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='min-w-[250px]'>
                            Khóa học
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[200px]'>
                            Học viên
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[150px] text-right'>
                            Doanh thu
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[180px]'>
                            Ngày thanh toán
                        </DarkOutlineTableHead>
                    </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                    {orders.map((order) => (
                        <DarkOutlineTableRow
                            key={order.id}
                            className='hover:bg-[#1F1F1F] transition-colors'
                        >
                            <DarkOutlineTableCell>
                                <span className='font-mono text-sm text-gray-300'>
                                    {order.orderCode}
                                </span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                <div className='flex items-center gap-3'>
                                    {order.course?.thumbnailUrl && (
                                        <img
                                            src={order.course.thumbnailUrl}
                                            alt={order.course.title || ''}
                                            className='h-10 w-16 object-cover rounded shrink-0'
                                        />
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-white font-medium truncate'>
                                            {order.course?.title || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                <div>
                                    <p className='text-white text-sm'>
                                        {order.user?.fullName || order.user?.userName || 'N/A'}
                                    </p>
                                    {order.user?.email && (
                                        <p className='text-gray-400 text-xs mt-0.5'>
                                            {order.user.email}
                                        </p>
                                    )}
                                </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-right'>
                                <span className='font-semibold text-white'>
                                    {formatPrice(parseFloat(order.finalPrice.toString()))}
                                </span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                <span className='text-sm text-gray-300'>
                                    {order.paidAt
                                        ? formatDateTime(order.paidAt)
                                        : 'N/A'}
                                </span>
                            </DarkOutlineTableCell>
                        </DarkOutlineTableRow>
                    ))}
                    {/* Total Revenue Row */}
                    <DarkOutlineTableRow className='bg-[#1F1F1F] border-t-2 border-[#3D3D3D]'>
                        <DarkOutlineTableCell className='font-semibold'>
                            <span className='text-white'>Tổng doanh thu:</span>
                        </DarkOutlineTableCell>
                        <DarkOutlineTableCell></DarkOutlineTableCell>
                        <DarkOutlineTableCell></DarkOutlineTableCell>
                        <DarkOutlineTableCell className='text-right'>
                            <span className='text-lg font-bold text-green-400'>
                                {formatPrice(totalRevenue)}
                            </span>
                        </DarkOutlineTableCell>
                        <DarkOutlineTableCell>
                            {pagination && (
                                <span className='text-xs text-gray-400'>
                                    {pagination.total} đơn hàng
                                </span>
                            )}
                        </DarkOutlineTableCell>
                    </DarkOutlineTableRow>
                </DarkOutlineTableBody>
            </DarkOutlineTable>
        </div>
    )
}

