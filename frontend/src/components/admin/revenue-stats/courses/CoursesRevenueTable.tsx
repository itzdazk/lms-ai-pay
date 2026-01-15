import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../../components/ui/dark-outline-table'
import { BookOpen, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

interface CourseRevenue {
    courseId: number
    courseTitle: string
    thumbnailUrl: string | null
    instructorName: string
    coursePrice: number
    orderCount: number
    totalRevenue: number
}

interface CoursesRevenueTableProps {
    data: CourseRevenue[]
    loading: boolean
    currentPage: number
    totalPages: number
    totalItems: number
    sortBy: 'revenue' | 'orderCount'
    onPageChange: (page: number) => void
    onSort: () => void
    formatPrice: (price: number) => string
}

export function CoursesRevenueTable({
    data,
    loading,
    currentPage,
    totalPages,
    totalItems,
    sortBy,
    onPageChange,
    onSort,
    formatPrice,
}: CoursesRevenueTableProps) {
    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-foreground flex items-center gap-2'>
                        <BookOpen className='h-5 w-5 text-blue-400' />
                        Danh sách khóa học
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-12'>
                        <div className='text-center'>
                            <div className='h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                            <p className='text-sm text-gray-400'>Đang tải...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-foreground flex items-center gap-2'>
                        <BookOpen className='h-5 w-5 text-blue-400' />
                        Danh sách khóa học
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='text-center py-12 text-gray-400'>
                        Chưa có dữ liệu
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                    <BookOpen className='h-5 w-5 text-blue-400' />
                    Danh sách khóa học
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='overflow-x-auto'>
                    <DarkOutlineTable>
                        <DarkOutlineTableHeader>
                            <DarkOutlineTableRow>
                                <DarkOutlineTableHead className='text-left'>
                                    Khóa học
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='text-left'>
                                    Tên giảng viên
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='text-right'>
                                    Giá khóa học
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='text-center'>
                                    <button
                                        onClick={onSort}
                                        className='flex items-center gap-1 hover:text-white transition-colors'
                                    >
                                        Số lượng mua
                                        <ArrowUpDown className='h-3 w-3' />
                                    </button>
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='text-right'>
                                    <button
                                        onClick={onSort}
                                        className='flex items-center gap-1 hover:text-white transition-colors'
                                    >
                                        Tổng doanh thu
                                        <ArrowUpDown className='h-3 w-3' />
                                    </button>
                                </DarkOutlineTableHead>
                            </DarkOutlineTableRow>
                        </DarkOutlineTableHeader>
                        <DarkOutlineTableBody>
                            {data.map((course) => (
                                <DarkOutlineTableRow key={course.courseId}>
                                    <DarkOutlineTableCell>
                                        <div className='flex items-center gap-3'>
                                            {course.thumbnailUrl ? (
                                                <img
                                                    src={course.thumbnailUrl}
                                                    alt={course.courseTitle}
                                                    className='h-16 w-28 object-cover rounded flex-shrink-0'
                                                />
                                            ) : (
                                                <div className='h-16 w-28 bg-[#2D2D2D] rounded flex items-center justify-center flex-shrink-0'>
                                                    <BookOpen className='h-6 w-6 text-gray-400' />
                                                </div>
                                            )}
                                            <span className='text-sm text-foreground font-medium'>
                                                {course.courseTitle}
                                            </span>
                                        </div>
                                    </DarkOutlineTableCell>
                                    <DarkOutlineTableCell>
                                        <span className='text-sm text-gray-300'>
                                            {course.instructorName}
                                        </span>
                                    </DarkOutlineTableCell>
                                    <DarkOutlineTableCell className='text-right'>
                                        <span className='text-sm text-gray-300'>
                                            {formatPrice(course.coursePrice)}
                                        </span>
                                    </DarkOutlineTableCell>
                                    <DarkOutlineTableCell className='text-center'>
                                        <span className='text-sm text-gray-300'>
                                            {course.orderCount.toLocaleString('vi-VN')}
                                        </span>
                                    </DarkOutlineTableCell>
                                    <DarkOutlineTableCell className='text-right'>
                                        <span className='text-sm font-semibold text-green-400'>
                                            {formatPrice(course.totalRevenue)}
                                        </span>
                                    </DarkOutlineTableCell>
                                </DarkOutlineTableRow>
                            ))}
                        </DarkOutlineTableBody>
                    </DarkOutlineTable>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-4 pt-4 border-t border-[#2D2D2D]'>
                        <div className='text-sm text-gray-400'>
                            Hiển thị {data.length} / {totalItems} khóa học
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className='h-8 px-3 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'
                            >
                                <ChevronLeft className='h-4 w-4' />
                            </Button>
                            <span className='text-sm text-gray-300 px-2'>
                                Trang {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className='h-8 px-3 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'
                            >
                                <ChevronRight className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
