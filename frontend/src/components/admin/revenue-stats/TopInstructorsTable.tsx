import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
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
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead className='text-left'>
                                        Tên
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-center'>
                                        Số khóa
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-right'>
                                        Doanh thu
                                    </DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {top5.map((instructor, index) => (
                                    <DarkOutlineTableRow key={instructor.instructorId}>
                                        <DarkOutlineTableCell>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-xs text-gray-400 w-6'>
                                                    #{index + 1}
                                                </span>
                                                <span className='text-sm text-white font-medium'>
                                                    {instructor.instructorName}
                                                </span>
                                            </div>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='text-center'>
                                            <span className='text-sm text-gray-300'>
                                                {instructor.courseCount}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='text-right'>
                                            <span className='text-sm font-semibold text-green-400'>
                                                {formatPrice(instructor.revenue)}
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
