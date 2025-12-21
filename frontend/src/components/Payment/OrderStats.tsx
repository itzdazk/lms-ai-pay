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
    totalSpent: number
}

type OrderStatsProps = {
    stats: OrderStats | null
    loading?: boolean
}

export function OrderStats({ stats, loading }: OrderStatsProps) {
    if (loading || !stats) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8'>
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
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-200 dark:bg-blue-950/30',
            borderColor: 'border-blue-400 dark:border-blue-900',
            isPrice: false,
            change: null,
        },
        {
            label: 'Đã thanh toán',
            value: stats.paid,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-200 dark:bg-green-950/30',
            borderColor: 'border-green-400 dark:border-green-900',
            isPrice: false,
            change:
                stats.total > 0
                    ? `${((stats.paid / stats.total) * 100).toFixed(0)}%`
                    : null,
        },
        {
            label: 'Đang chờ',
            value: stats.pending,
            icon: Clock,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-200 dark:bg-yellow-950/30',
            borderColor: 'border-yellow-400 dark:border-yellow-900',
            isPrice: false,
            change: null,
        },
        {
            label: 'Thất bại',
            value: stats.failed,
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-200 dark:bg-red-950/30',
            borderColor: 'border-red-400 dark:border-red-900',
            isPrice: false,
            change: null,
        },
        {
            label: 'Đã hoàn tiền',
            value: stats.refunded,
            icon: RefreshCw,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-200 dark:bg-purple-950/30',
            borderColor: 'border-purple-400 dark:border-purple-900',
            isPrice: false,
            change: null,
        },
        {
            label: 'Tổng chi tiêu',
            value: stats.totalSpent,
            icon: DollarSign,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-200 dark:bg-orange-950/30',
            borderColor: 'border-orange-400 dark:border-orange-900',
            isPrice: true,
            change: null,
        },
    ]

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8'>
            {statsCards.map((stat) => (
                <Card
                    key={stat.label}
                    className={`overflow-hidden border-l-4 ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium text-muted-foreground'>
                            {stat.label}
                        </CardTitle>
                        <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-1'>
                            <div className='text-2xl font-bold'>
                                {stat.isPrice
                                    ? formatPrice(stat.value as number)
                                    : (stat.value as number).toLocaleString(
                                          'vi-VN'
                                      )}
                            </div>
                            {stat.change && (
                                <div className='flex items-center text-xs text-muted-foreground'>
                                    <TrendingUp className='h-3 w-3 mr-1 text-green-600 dark:text-green-400' />
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
