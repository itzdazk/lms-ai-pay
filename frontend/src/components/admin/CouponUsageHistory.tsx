import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table'
import { Button } from '../ui/button'
import { Loader2, User, ShoppingCart } from 'lucide-react'
import { adminCouponsApi } from '../../lib/api/admin-coupons'
import type { CouponUsage } from '../../lib/api/types'
import { toast } from 'sonner'
import { formatPrice } from '../../lib/courseUtils'

interface CouponUsageHistoryProps {
    couponId: number
}

export function CouponUsageHistory({ couponId }: CouponUsageHistoryProps) {
    const [usages, setUsages] = useState<CouponUsage[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const limit = 10

    useEffect(() => {
        fetchUsageHistory()
    }, [couponId, page])

    const fetchUsageHistory = async () => {
        try {
            setLoading(true)
            const result = await adminCouponsApi.getCouponUsageHistory(
                couponId,
                { page, limit },
            )
            setUsages(result.usages)
            setTotal(result.pagination.total)
        } catch (error) {
            console.error('Error fetching usage history:', error)
            toast.error('Không thể tải lịch sử sử dụng')
        } finally {
            setLoading(false)
        }
    }

    const totalPages = Math.ceil(total / limit)

    if (loading) {
        return (
            <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            </div>
        )
    }

    if (usages.length === 0) {
        return (
            <div className='text-center py-12'>
                <ShoppingCart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-400'>Chưa có lượt sử dụng nào</p>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
                <Table>
                    <TableHeader>
                        <TableRow className='border-[#2D2D2D] hover:bg-[#1F1F1F]'>
                            <TableHead className='text-gray-400'>
                                Người dùng
                            </TableHead>
                            <TableHead className='text-gray-400'>
                                Đơn hàng
                            </TableHead>
                            <TableHead className='text-gray-400'>
                                Số tiền giảm
                            </TableHead>
                            <TableHead className='text-gray-400'>
                                Thời gian
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usages.map((usage) => (
                            <TableRow
                                key={usage.id}
                                className='border-[#2D2D2D] hover:bg-[#1F1F1F]'
                            >
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        <User className='h-4 w-4 text-gray-400' />
                                        <div>
                                            <p className='text-white font-medium'>
                                                {usage.user?.fullName || 'N/A'}
                                            </p>
                                            <p className='text-xs text-gray-400'>
                                                {usage.user?.email || ''}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {usage.order ? (
                                        <div>
                                            <p className='text-white font-mono text-sm'>
                                                {usage.order.orderCode}
                                            </p>
                                            <p className='text-xs text-gray-400'>
                                                {usage.order.course?.title}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className='text-gray-400'>-</span>
                                    )}
                                </TableCell>
                                <TableCell className='text-green-400 font-semibold'>
                                    {formatPrice(usage.amountReduced)}
                                </TableCell>
                                <TableCell className='text-gray-400 text-sm'>
                                    {new Date(usage.usedAt).toLocaleString(
                                        'vi-VN',
                                        {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className='flex items-center justify-between'>
                    <p className='text-sm text-gray-400'>
                        Hiển thị {(page - 1) * limit + 1} -{' '}
                        {Math.min(page * limit, total)} trong tổng số {total}{' '}
                        lượt sử dụng
                    </p>
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className='border-[#2D2D2D] text-white hover:bg-[#1F1F1F]'
                        >
                            Trước
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={page === totalPages}
                            className='border-[#2D2D2D] text-white hover:bg-[#1F1F1F]'
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
