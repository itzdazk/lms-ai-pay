import { Card, CardContent } from '../../ui/card'
import { Tag, TrendingUp, Users, Calendar } from 'lucide-react'
import { formatPrice } from '../../../lib/courseUtils'
import type { Coupon } from '../../../lib/api/types'

interface CouponStatsProps {
    coupons: Coupon[]
    total: number
}

export function CouponStats({ coupons, total }: CouponStatsProps) {
    const activeCoupons = coupons.filter((c) => c.active).length
    const totalUsages = coupons.reduce((sum, c) => sum + c.usesCount, 0)
    const totalDiscount = coupons.reduce(
        (sum, c) => sum + (c.totalDiscountGiven || 0),
        0,
    )

    return (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='pt-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-400'>Tổng mã</p>
                            <p className='text-2xl font-bold text-white'>
                                {total}
                            </p>
                        </div>
                        <Tag className='h-8 w-8 text-blue-400' />
                    </div>
                </CardContent>
            </Card>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='pt-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-400'>
                                Đang hoạt động
                            </p>
                            <p className='text-2xl font-bold text-green-400'>
                                {activeCoupons}
                            </p>
                        </div>
                        <TrendingUp className='h-8 w-8 text-green-400' />
                    </div>
                </CardContent>
            </Card>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='pt-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-400'>
                                Tổng lượt dùng
                            </p>
                            <p className='text-2xl font-bold text-purple-400'>
                                {totalUsages}
                            </p>
                        </div>
                        <Users className='h-8 w-8 text-purple-400' />
                    </div>
                </CardContent>
            </Card>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='pt-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-400'>
                                Tổng giảm giá
                            </p>
                            <p className='text-2xl font-bold text-yellow-400'>
                                {formatPrice(totalDiscount)}
                            </p>
                        </div>
                        <Calendar className='h-8 w-8 text-yellow-400' />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
