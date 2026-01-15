import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Users, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

interface InstructorRevenue {
    instructorId: number
    instructorName: string
    email: string
    courseCount: number
    orderCount: number
    totalRevenue: number
    rank: number
}

interface InstructorsRevenueTableProps {
    data: InstructorRevenue[]
    loading: boolean
    currentPage: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
    onSort: () => void
    formatPrice: (price: number) => string
}

export function InstructorsRevenueTable({
    data,
    loading,
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    onSort,
    formatPrice,
}: InstructorsRevenueTableProps) {
    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-foreground flex items-center gap-2'>
                        <Users className='h-5 w-5 text-blue-400' />
                        Danh sách giảng viên
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
                        <Users className='h-5 w-5 text-blue-400' />
                        Danh sách giảng viên
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
                    <Users className='h-5 w-5 text-blue-400' />
                    Danh sách giảng viên
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b border-[#2D2D2D]'>
                                <th className='text-left py-3 px-4 text-xs font-semibold text-gray-400'>
                                    Chỉ số
                                </th>
                                <th className='text-left py-3 px-4 text-xs font-semibold text-gray-400'>
                                    Tên giảng viên
                                </th>
                                <th className='text-left py-3 px-4 text-xs font-semibold text-gray-400'>
                                    Email
                                </th>
                                <th className='text-center py-3 px-4 text-xs font-semibold text-gray-400'>
                                    Số lượng khóa học
                                </th>
                                <th className='text-center py-3 px-4 text-xs font-semibold text-gray-400'>
                                    Số lượng mua
                                </th>
                                <th className='text-right py-3 px-4 text-xs font-semibold text-gray-400'>
                                    <button
                                        onClick={onSort}
                                        className='flex items-center gap-1 hover:text-white transition-colors'
                                    >
                                        Tổng doanh thu
                                        <ArrowUpDown className='h-3 w-3' />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((instructor) => (
                                <tr
                                    key={instructor.instructorId}
                                    className='border-b border-[#2D2D2D] hover:bg-[#1F1F1F] transition-colors'
                                >
                                    <td className='py-3 px-4'>
                                        <span className='text-sm font-semibold text-blue-400'>
                                            #{instructor.rank}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4'>
                                        <span className='text-sm text-foreground font-medium'>
                                            {instructor.instructorName}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4'>
                                        <span className='text-sm text-gray-300'>
                                            {instructor.email}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 text-center'>
                                        <span className='text-sm text-gray-300'>
                                            {instructor.courseCount}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 text-center'>
                                        <span className='text-sm text-gray-300'>
                                            {instructor.orderCount.toLocaleString('vi-VN')}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 text-right'>
                                        <span className='text-sm font-semibold text-green-400'>
                                            {formatPrice(instructor.totalRevenue)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-4 pt-4 border-t border-[#2D2D2D]'>
                        <div className='text-sm text-gray-400'>
                            Hiển thị {data.length} / {totalItems} giảng viên
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
