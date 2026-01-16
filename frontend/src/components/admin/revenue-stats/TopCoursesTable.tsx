import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
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
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead className='text-left'>
                                        Khóa học
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Giảng viên
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-right'>
                                        Doanh thu
                                    </DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {top5.map((course, index) => (
                                    <DarkOutlineTableRow key={course.courseId}>
                                        <DarkOutlineTableCell>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-xs text-gray-400 w-6'>
                                                    #{index + 1}
                                                </span>
                                                <span className='text-sm text-white font-medium truncate max-w-[200px]'>
                                                    {course.courseTitle}
                                                </span>
                                            </div>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <span className='text-sm text-gray-300 truncate max-w-[150px] block'>
                                                {course.instructorName}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='text-right'>
                                            <span className='text-sm font-semibold text-green-400'>
                                                {formatPrice(course.revenue)}
                                            </span>
                                        </DarkOutlineTableCell>
                                    </DarkOutlineTableRow>
                                ))}
                            </DarkOutlineTableBody>
                        </DarkOutlineTable>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
