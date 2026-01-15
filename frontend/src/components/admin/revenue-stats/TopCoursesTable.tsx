import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BookOpen } from 'lucide-react'

interface TopCoursesTableProps {
    data: Array<{
        courseId: number
        courseTitle: string
        instructorName: string
        revenue: number
    }>
    formatPrice: (price: number) => string
}

export function TopCoursesTable({
    data,
    formatPrice,
}: TopCoursesTableProps) {
    const top5 = data.slice(0, 5)

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <BookOpen className='h-5 w-5 text-purple-400' />
                    Doanh thu theo khóa học (Top 5)
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
                                        Khóa học
                                    </th>
                                    <th className='text-left py-3 px-4 text-xs font-semibold text-gray-400'>
                                        Giảng viên
                                    </th>
                                    <th className='text-right py-3 px-4 text-xs font-semibold text-gray-400'>
                                        Doanh thu
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {top5.map((course, index) => (
                                    <tr
                                        key={course.courseId}
                                        className='border-b border-[#2D2D2D] hover:bg-[#1F1F1F] transition-colors'
                                    >
                                        <td className='py-3 px-4'>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-xs text-gray-400 w-6'>
                                                    #{index + 1}
                                                </span>
                                                <span className='text-sm text-white font-medium truncate max-w-[200px]'>
                                                    {course.courseTitle}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='py-3 px-4'>
                                            <span className='text-sm text-gray-300 truncate max-w-[150px] block'>
                                                {course.instructorName}
                                            </span>
                                        </td>
                                        <td className='py-3 px-4 text-right'>
                                            <span className='text-sm font-semibold text-green-400'>
                                                {formatPrice(course.revenue)}
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
