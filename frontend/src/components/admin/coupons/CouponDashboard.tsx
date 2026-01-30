import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    Tag,
    TrendingUp,
    Clock,
    XCircle,
    DollarSign,
    Calendar,
} from 'lucide-react'
import { adminCouponsApi } from '@/lib/api/admin-coupons'
import { CouponOverviewMetrics } from '@/lib/api/types'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function CouponDashboard() {
    const [metrics, setMetrics] = useState<CouponOverviewMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMetrics()
    }, [])

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            const data = await adminCouponsApi.getCouponOverview()
            setMetrics(data)
        } catch (error: any) {
            console.error('Error fetching coupon metrics:', error)
            toast.error('Không thể tải metrics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='pt-6'>
                            <Skeleton className='h-16 w-full bg-[#2D2D2D]' />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!metrics) {
        return null
    }

    const stats = [
        {
            label: 'Tổng mã',
            value: metrics.total,
            icon: Tag,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Đang hoạt động',
            value: metrics.active,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Đã lên lịch',
            value: metrics.scheduled,
            icon: Clock,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
        },
        {
            label: 'Đã hết hạn',
            value: metrics.expired,
            icon: Calendar,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
        },
        {
            label: 'Đã vô hiệu',
            value: metrics.disabled,
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
        },
        {
            label: 'Tổng giảm giá',
            value: formatPrice(metrics.totalDiscountGiven),
            icon: DollarSign,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            isPrice: true,
        },
    ]

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card
                        key={index}
                        className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D] transition-colors'
                    >
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex-1'>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        {stat.label}
                                    </p>
                                    <p
                                        className={`text-2xl font-bold ${stat.color}`}
                                    >
                                        {stat.isPrice
                                            ? stat.value
                                            : stat.value.toLocaleString(
                                                  'vi-VN',
                                              )}
                                    </p>
                                </div>
                                <div
                                    className={`${stat.bgColor} p-3 rounded-lg`}
                                >
                                    <Icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
