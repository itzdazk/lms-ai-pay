import { Card, CardContent } from '../../../components/ui/card'
import {
    Loader2,
    ShoppingCart,
    CheckCircle,
    Clock,
    XCircle,
    DollarSign,
    TrendingUp,
} from 'lucide-react'
import type { AdminOrderStats } from '../../../lib/api/admin-orders'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

interface OrdersStatsProps {
    loading: boolean
    stats: AdminOrderStats | null
}

export function OrdersStats({ loading, stats }: OrdersStatsProps) {
    if (!stats && !loading) return null

    return (
        <>
            {!loading && stats && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Tổng đơn hàng
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.overview.totalOrders.toLocaleString()}
                                    </p>
                                </div>
                                <ShoppingCart className='h-8 w-8 text-blue-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Đã thanh toán
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.overview.paidOrders.toLocaleString()}
                                    </p>
                                </div>
                                <CheckCircle className='h-8 w-8 text-green-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Đang chờ
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.overview.pendingOrders.toLocaleString()}
                                    </p>
                                </div>
                                <Clock className='h-8 w-8 text-yellow-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Thất bại
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.overview.failedOrders.toLocaleString()}
                                    </p>
                                </div>
                                <XCircle className='h-8 w-8 text-red-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Tỷ lệ chuyển đổi
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.overview.conversionRate.toFixed(
                                            2
                                        )}
                                        %
                                    </p>
                                </div>
                                <TrendingUp className='h-8 w-8 text-purple-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Tổng doanh thu
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {formatPrice(stats.allTime.revenue)}
                                    </p>
                                </div>
                                <DollarSign className='h-8 w-8 text-green-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Doanh thu tháng này
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {formatPrice(stats.thisMonth.revenue)}
                                    </p>
                                    {stats.thisMonth.revenueGrowth !==
                                        undefined && (
                                        <p
                                            className={`text-xs mt-1 ${
                                                stats.thisMonth.revenueGrowth >=
                                                0
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            {stats.thisMonth.revenueGrowth >= 0
                                                ? '↑'
                                                : '↓'}{' '}
                                            {Math.abs(
                                                stats.thisMonth.revenueGrowth
                                            ).toFixed(2)}
                                            %
                                        </p>
                                    )}
                                </div>
                                <TrendingUp className='h-8 w-8 text-blue-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Giá trị đơn trung bình
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {formatPrice(
                                            stats.allTime.averageOrderValue
                                        )}
                                    </p>
                                </div>
                                <DollarSign className='h-8 w-8 text-yellow-500' />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {loading && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='p-6'>
                                <div className='flex items-center justify-center h-24'>
                                    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    )
}
