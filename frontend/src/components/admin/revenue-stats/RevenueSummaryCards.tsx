import { Card, CardContent } from '../../../components/ui/card'
import { DollarSign, ShoppingCart } from 'lucide-react'

interface RevenueSummaryCardsProps {
    totalRevenue: number
    totalOrders: number
    formatPrice: (price: number) => string
}

export function RevenueSummaryCards({
    totalRevenue,
    totalOrders,
    formatPrice,
}: RevenueSummaryCardsProps) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Total Revenue */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng doanh thu</p>
                            <p className='text-2xl font-bold text-white'>
                                {formatPrice(totalRevenue)}
                            </p>
                        </div>
                        <DollarSign className='h-8 w-8 text-green-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng đơn hàng</p>
                            <p className='text-2xl font-bold text-white'>
                                {totalOrders.toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <ShoppingCart className='h-8 w-8 text-blue-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
