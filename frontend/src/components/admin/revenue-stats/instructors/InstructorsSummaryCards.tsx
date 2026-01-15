import { Card, CardContent } from '../../../../components/ui/card'
import { DollarSign, Users, BookOpen } from 'lucide-react'

interface InstructorsSummaryCardsProps {
    totalRevenue: number
    instructorCount: number
    totalCoursesSold: number
    formatPrice: (price: number) => string
}

export function InstructorsSummaryCards({
    totalRevenue,
    instructorCount,
    totalCoursesSold,
    formatPrice,
}: InstructorsSummaryCardsProps) {
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

            {/* Instructor Count */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Số lượng giảng viên có doanh thu</p>
                            <p className='text-2xl font-bold text-foreground'>
                                {instructorCount.toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <Users className='h-8 w-8 text-blue-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>

            {/* Total Courses Sold */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-xs text-gray-400 mb-1'>Tổng số khóa học đã bán</p>
                            <p className='text-2xl font-bold text-foreground'>
                                {totalCoursesSold.toLocaleString('vi-VN')}
                            </p>
                        </div>
                        <BookOpen className='h-8 w-8 text-purple-400 opacity-50' />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
