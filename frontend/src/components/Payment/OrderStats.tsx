import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import {
    ShoppingBag,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    DollarSign,
    TrendingUp,
} from 'lucide-react'

export type OrderStats = {
    total: number
    paid: number
    pending: number
    failed: number
    refunded: number
    partiallyRefunded: number
    totalSpent: number
}

type OrderStatsProps = {
    stats: OrderStats | null
    loading?: boolean
}

export function OrderStats({ stats, loading }: OrderStatsProps) {
    if (loading || !stats) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className='overflow-hidden'>
                        <CardHeader className='pb-3'>
                            <Skeleton className='h-4 w-24' />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='h-8 w-20 mb-2' />
                            <Skeleton className='h-3 w-16' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    const statsCards = [
        {
            label: 'Tổng đơn hàng',
            value: stats.total,
            icon: ShoppingBag,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: false,
            change: null,
        },
        {
            label: 'Đã thanh toán',
            value: stats.paid,
            icon: CheckCircle,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: false,
            change:
                stats.total > 0
                    ? `${((stats.paid / stats.total) * 100).toFixed(0)}%`
                    : null,
        },
        {
            label: 'Đang chờ thanh toán',
            value: stats.pending,
            icon: Clock,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: false,
            change: null,
        },
        {
            label: 'Thanh toán thất bại',
            value: stats.failed,
            icon: XCircle,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: false,
            change: null,
        },
        {
            label: 'Đã hoàn tiền',
            value: stats.refunded + (stats.partiallyRefunded || 0),
            icon: RefreshCw,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: false,
            change: null,
        },
        {
            label: 'Tổng chi tiêu',
            value: stats.totalSpent,
            icon: DollarSign,
            color: 'text-gray-400',
            bgColor: 'bg-gray-800/50',
            borderColor: 'border-gray-700',
            isPrice: true,
            change: null,
        },
    ]

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'>
            {statsCards.map((stat) => (
                <Card
                    key={stat.label}
                    className={`overflow-hidden border-l-4 ${stat.borderColor} bg-[#1A1A1A]`}
                >
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-gray-300 dark:text-gray-300'>
                            {stat.label}
                        </CardTitle>
                        <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold text-gray-300 dark:text-gray-300'>
                                {stat.isPrice
                                    ? formatPrice(stat.value as number)
                                    : (stat.value as number).toLocaleString(
                                          'vi-VN'
                                      )}
                            </div>
                            {stat.change && (
                                <div className='flex items-center text-xs text-gray-300 dark:text-gray-300'>
                                    <TrendingUp className='h-3 w-3 mr-1 text-green-600 dark:text-green-600' />
                                    <span>{stat.change} của tổng</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
