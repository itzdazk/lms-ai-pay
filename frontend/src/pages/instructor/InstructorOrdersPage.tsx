import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../../components/ui/buttons'
import { OrderTable } from '../../components/Payment/OrderTable'
import {
    OrderFilters,
    type OrderFilters as OrderFiltersType,
} from '../../components/Payment/OrderFilters'
import { useInstructorOrders } from '../../hooks/useInstructorOrders'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import type { Course } from '../../lib/api/types'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select'

export type InstructorOrderFilters = OrderFiltersType & {
    courseId?: number
}

export function InstructorOrdersPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [courses, setCourses] = useState<Course[]>([])

    // Filters state
    const [filters, setFilters] = useState<InstructorOrderFilters>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        paymentStatus: (searchParams.get('paymentStatus') as any) || undefined,
        paymentGateway:
            (searchParams.get('paymentGateway') as any) || undefined,
        courseId: (() => {
            const courseIdParam = searchParams.get('courseId')
            if (courseIdParam) {
                const parsed = parseInt(courseIdParam)
                return isNaN(parsed) ? undefined : parsed
            }
            return undefined
        })(),
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        sort: (searchParams.get('sort') as any) || 'newest',
        search: searchParams.get('search') || undefined,
    })

    // Fetch courses for filter
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await instructorCoursesApi.getInstructorCourses({
                    page: 1,
                    limit: 100,
                })
                setCourses(data.data || [])
            } catch (error) {
                console.error('Error fetching courses:', error)
            }
        }
        fetchCourses()
    }, [])

    // Hooks
    const { orders, pagination, isLoading } = useInstructorOrders(filters)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.page && filters.page > 1)
            params.set('page', filters.page.toString())
        if (filters.paymentStatus)
            params.set('paymentStatus', filters.paymentStatus)
        if (filters.paymentGateway)
            params.set('paymentGateway', filters.paymentGateway)
        if (filters.courseId)
            params.set('courseId', filters.courseId.toString())
        if (filters.startDate) params.set('startDate', filters.startDate)
        if (filters.endDate) params.set('endDate', filters.endDate)
        if (filters.sort && filters.sort !== 'newest')
            params.set('sort', filters.sort)
        if (filters.search) params.set('search', filters.search)

        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (key: keyof InstructorOrderFilters, value: any) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
                page: 1, // Reset to first page when filter changes
            }))
        },
        []
    )

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, page }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
            sort: 'newest',
        })
    }, [])

    // Render pagination
    const renderPagination = () => {
        const pages: (number | string)[] = []
        const totalPages = pagination.totalPages
        const currentPage = pagination.page

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            if (currentPage > 3) {
                pages.push('...')
            }
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            pages.push(totalPages)
        }

        return (
            <div className='flex items-center justify-center gap-2 flex-wrap mt-6'>
                <DarkOutlineButton
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;
                </DarkOutlineButton>
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-400'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNum = page as number
                    return (
                        <DarkOutlineButton
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            size='sm'
                            className={
                                currentPage === pageNum
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNum}
                        </DarkOutlineButton>
                    )
                })}
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
    }

    return (
        <div className='bg-white dark:bg-black min-h-screen'>
            {/* Header Section */}
            <div className='bg-[#1A1A1A] border-b border-[#2d2d2d]'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='mb-2'>
                        <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white'>
                            Đơn hàng của khóa học
                        </h1>
                        <p className='text-base text-gray-300 leading-relaxed'>
                            Xem và quản lý tất cả đơn hàng của các khóa học bạn
                            dạy
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                {/* Course Filter */}
                <div className='mb-4'>
                    <div className='flex items-center gap-4'>
                        <label className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                            Lọc theo khóa học:
                        </label>
                        <Select
                            value={
                                filters.courseId
                                    ? filters.courseId.toString()
                                    : 'all'
                            }
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    handleFilterChange('courseId', undefined)
                                } else {
                                    const parsed = parseInt(value)
                                    if (!isNaN(parsed)) {
                                        handleFilterChange('courseId', parsed)
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className='w-[300px] bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                                <SelectValue placeholder='Tất cả khóa học' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1f1f1f] border-[#2d2d2d]'>
                                <SelectItem value='all' className='text-white'>
                                    Tất cả khóa học
                                </SelectItem>
                                {courses.map((course) => (
                                    <SelectItem
                                        key={course.id}
                                        value={course.id.toString()}
                                        className='text-white'
                                    >
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filters */}
                <OrderFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    totalResults={pagination.total}
                />

                {/* Orders Table - No actions for instructor */}
                <OrderTable
                    orders={orders}
                    loading={isLoading}
                    onCancel={undefined}
                    showActions={false}
                />

                {/* Pagination */}
                {pagination.totalPages > 1 && renderPagination()}
            </div>
        </div>
    )
}
