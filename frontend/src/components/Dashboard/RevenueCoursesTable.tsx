import { useState } from 'react'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../ui/dark-outline-table'
import { Skeleton } from '../ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { DarkOutlineButton } from '../ui/buttons'
import { Eye, Loader2 } from 'lucide-react'
import type { CourseRevenueData } from '../../lib/api/instructor-dashboard'
import { formatPrice } from '../../lib/courseUtils'
import { useInstructorRevenueOrders } from '../../hooks/useInstructorRevenueOrders'
import { formatDateTime } from '../../lib/utils'
import type { Order } from '../../lib/api/types'

interface RevenueCoursesTableProps {
    courses: CourseRevenueData[]
    loading?: boolean
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    year: number
    month: number | null
}

export function RevenueCoursesTable({
    courses,
    loading = false,
    pagination,
    year,
    month,
}: RevenueCoursesTableProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
    const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Fetch orders for selected course
    const {
        orders,
        isLoading: ordersLoading,
        pagination: ordersPagination,
    } = useInstructorRevenueOrders({
        year,
        month,
        courseId: selectedCourseId,
        page: 1,
        limit: 50, // Show up to 50 orders in dialog
    })

    // Courses are already sorted by revenue (descending) from backend
    const courseRevenueData = courses

    // Calculate totals
    const totalRevenue = courseRevenueData.reduce((sum, item) => sum + item.revenue, 0)
    const totalOrders = courseRevenueData.reduce((sum, item) => sum + item.orderCount, 0)

    const handleViewOrders = (courseId: number, courseTitle: string) => {
        setSelectedCourseId(courseId)
        setSelectedCourseTitle(courseTitle)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setSelectedCourseId(null)
        setSelectedCourseTitle('')
    }

    if (loading) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
                <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                        <DarkOutlineTableRow>
                            <DarkOutlineTableHead className='min-w-[300px]'>
                                Khóa học
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[120px] text-right'>
                                Giá
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[150px] text-right'>
                                Số đơn hàng
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[150px] text-right'>
                                Doanh thu
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead className='w-[100px] text-center'>
                                Thao tác
                            </DarkOutlineTableHead>
                        </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <DarkOutlineTableRow key={i}>
                                <DarkOutlineTableCell>
                                    <div className='flex items-center gap-3'>
                                        <Skeleton className='h-10 w-16 shrink-0' />
                                        <div className='flex-1'>
                                            <Skeleton className='h-4 w-40 mb-2' />
                                        </div>
                                    </div>
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='text-right'>
                                    <Skeleton className='h-4 w-20 ml-auto' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='text-right'>
                                    <Skeleton className='h-4 w-20 ml-auto' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='text-right'>
                                    <Skeleton className='h-4 w-24 ml-auto' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell className='text-center'>
                                    <Skeleton className='h-8 w-16 mx-auto' />
                                </DarkOutlineTableCell>
                            </DarkOutlineTableRow>
                        ))}
                    </DarkOutlineTableBody>
                </DarkOutlineTable>
            </div>
        )
    }

    if (courseRevenueData.length === 0) {
        return (
            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
                <div className='p-12 text-center'>
                    <p className='text-gray-400 mb-2'>Chưa có khóa học nào có đơn hàng</p>
                    <p className='text-sm text-gray-500'>
                        Không có khóa học nào có đơn hàng đã thanh toán trong khoảng thời gian đã chọn
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className='rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]'>
            <DarkOutlineTable>
                <DarkOutlineTableHeader>
                    <DarkOutlineTableRow>
                        <DarkOutlineTableHead className='min-w-[300px]'>
                            Khóa học
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[120px] text-right'>
                            Giá
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[150px] text-right'>
                            Số đơn hàng
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[150px] text-right'>
                            Doanh thu
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead className='w-[100px] text-center'>
                            Thao tác
                        </DarkOutlineTableHead>
                    </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                    {courseRevenueData.map((course) => (
                        <DarkOutlineTableRow
                            key={course.courseId}
                            className='hover:bg-[#1F1F1F] transition-colors'
                        >
                            <DarkOutlineTableCell>
                                <div className='flex items-center gap-3'>
                                    {course.courseThumbnailUrl && (
                                        <img
                                            src={course.courseThumbnailUrl}
                                            alt={course.courseTitle}
                                            className='h-10 w-16 object-cover rounded shrink-0'
                                        />
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-white font-medium truncate'>
                                            {course.courseTitle}
                                        </p>
                                    </div>
                                </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-right'>
                                <span className='font-semibold text-white'>
                                    {formatPrice(course.coursePrice || 0)}
                                </span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-right'>
                                <span className='font-semibold text-white'>
                                    {course.orderCount.toLocaleString('vi-VN')}
                                </span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-right'>
                                <span className='font-semibold text-white'>
                                    {formatPrice(course.revenue)}
                                </span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-center'>
                                <DarkOutlineButton
                                    size="sm"
                                    onClick={() => handleViewOrders(course.courseId, course.courseTitle)}
                                    className="flex items-center gap-1"
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem
                                </DarkOutlineButton>
                            </DarkOutlineTableCell>
                        </DarkOutlineTableRow>
                    ))}
                    {/* Total Row */}
                    <DarkOutlineTableRow className='bg-[#1F1F1F] border-t-2 border-[#3D3D3D]'>
                        <DarkOutlineTableCell className='font-semibold'>
                            <span className='text-white'>Tổng cộng:</span>
                        </DarkOutlineTableCell>
                        <DarkOutlineTableCell></DarkOutlineTableCell>
                        <DarkOutlineTableCell className='text-right'>
                            <span className='text-lg font-bold text-blue-400'>
                                {totalOrders.toLocaleString('vi-VN')}
                            </span>
                        </DarkOutlineTableCell>
                        <DarkOutlineTableCell className='text-right'>
                            <span className='text-lg font-bold text-green-400'>
                                {formatPrice(totalRevenue)}
                            </span>
                        </DarkOutlineTableCell>
                        <DarkOutlineTableCell></DarkOutlineTableCell>
                    </DarkOutlineTableRow>
                </DarkOutlineTableBody>
            </DarkOutlineTable>

            {/* Orders Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent 
                    wide
                    className="max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col bg-[#1A1A1A] border-[#2D2D2D]"
                >
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-white">
                            Chi tiết đơn hàng - {selectedCourseTitle}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto mt-4">
                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">Chưa có đơn hàng nào</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-[#2D2D2D] overflow-hidden bg-[#1A1A1A]">
                                <DarkOutlineTable>
                                    <DarkOutlineTableHeader>
                                        <DarkOutlineTableRow>
                                            <DarkOutlineTableHead className="w-[150px]">
                                                Mã đơn
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead className="w-[200px]">
                                                Học viên
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead className="w-[150px] text-right">
                                                Giá
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead className="w-[180px]">
                                                Ngày thanh toán
                                            </DarkOutlineTableHead>
                                        </DarkOutlineTableRow>
                                    </DarkOutlineTableHeader>
                                    <DarkOutlineTableBody>
                                        {orders.map((order: Order) => (
                                            <DarkOutlineTableRow
                                                key={order.id}
                                                className="hover:bg-[#1F1F1F] transition-colors"
                                            >
                                                <DarkOutlineTableCell>
                                                    <span className="font-mono text-sm text-gray-300">
                                                        {order.orderCode}
                                                    </span>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <div>
                                                        <p className="text-white text-sm">
                                                            {order.user?.fullName || order.user?.userName || 'N/A'}
                                                        </p>
                                                        {order.user?.email && (
                                                            <p className="text-gray-400 text-xs mt-0.5">
                                                                {order.user.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell className="text-right">
                                                    <span className="font-semibold text-white">
                                                        {formatPrice(parseFloat(order.finalPrice.toString()))}
                                                    </span>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <span className="text-sm text-gray-300">
                                                        {order.paidAt
                                                            ? formatDateTime(order.paidAt)
                                                            : 'N/A'}
                                                    </span>
                                                </DarkOutlineTableCell>
                                            </DarkOutlineTableRow>
                                        ))}
                                    </DarkOutlineTableBody>
                                </DarkOutlineTable>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
