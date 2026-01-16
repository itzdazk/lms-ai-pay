import { Card, CardContent } from '../../../../components/ui/card'
import { DollarSign, BookOpen, ShoppingCart } from 'lucide-react'

interface CoursesSummaryCardsProps {
    totalRevenue: number
    courseCount: number
    totalOrders: number
    formatPrice: (price: number) => string
}

export function CoursesSummaryCards({
    totalRevenue,
    courseCount,
    totalOrders,
    formatPrice,
}: CoursesSummaryCardsProps) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Total Revenue */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng doanh thu</p>
                            <p className='text-2xl font-bold text-foreground'>
                                {formatPrice(totalRevenue)}
                            </p>
                        </div>
                        <DollarSign className='h-8 w-8 text-green-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>

            {/* Course Count */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Số lượng khóa học có doanh thu</p>
                            <p className='text-2xl font-bold text-foreground'>
                                {courseCount.toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <BookOpen className='h-8 w-8 text-blue-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng số lượng mua</p>
                            <p className='text-2xl font-bold text-foreground'>
                                {totalOrders.toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <ShoppingCart className='h-8 w-8 text-purple-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
