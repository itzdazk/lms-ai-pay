import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { User } from 'lucide-react'

interface TopInstructorsTableProps {
    data: Array<{
        instructorId: number
        instructorName: string
        courseCount: number
        revenue: number
    }>
    formatPrice: (price: number) => string
}

export function TopInstructorsTable({
    data,
    formatPrice,
}: TopInstructorsTableProps) {
    const top5 = data.slice(0, 5)

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <User className='h-5 w-5 text-blue-400' />
                    Doanh thu theo giảng viên (Top 5)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {top5.length === 0 ? (
                    <div className='text-center py-8 text-gray-400'>
                        Chưa có dữ liệu
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead>
                                <tr className='border-b border-[#2D2D2D]'>
                                    <th className='text-left py-3 px-4 text-xs font-semibold text-gray-400'>
                                        Tên
                                    </th>
                                    <th className='text-center py-3 px-4 text-xs font-semibold text-gray-400'>
                                        Số khóa
                                    </th>
                                    <th className='text-right py-3 px-4 text-xs font-semibold text-gray-400'>
                                        Doanh thu
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {top5.map((instructor, index) => (
                                    <tr
                                        key={instructor.instructorId}
                                        className='border-b border-[#2D2D2D] hover:bg-[#1F1F1F] transition-colors'
                                    >
                                        <td className='py-3 px-4'>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-xs text-gray-400 w-6'>
                                                    #{index + 1}
                                                </span>
                                                <span className='text-sm text-white font-medium'>
                                                    {instructor.instructorName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='py-3 px-4 text-center'>
                                            <span className='text-sm text-gray-300'>
                                                {instructor.courseCount}
                                            </span>
                                        </td>
                                        <td className='py-3 px-4 text-right'>
                                            <span className='text-sm font-semibold text-green-400'>
                                                {formatPrice(instructor.revenue)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
