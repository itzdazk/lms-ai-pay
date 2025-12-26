import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DarkOutlineButton } from '../../components/ui/buttons'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../../components/ui/dark-outline-table'
import { Skeleton } from '../../components/ui/skeleton'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { useInstructorEnrollments } from '../../hooks/useInstructorEnrollments'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import type { Course } from '../../lib/api/types'
import { formatDateTime } from '../../lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select'
import { Progress } from '../../components/ui/progress'

export type InstructorEnrollmentFilters = {
    page?: number
    limit?: number
    search?: string
    courseId?: number
    status?: string
    startDate?: string
    endDate?: string
    sort?: string
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'ACTIVE':
            return (
                <Badge className='bg-green-600/20 text-green-300 border border-green-500/40'>
                    Đang học
                </Badge>
            )
        case 'COMPLETED':
            return (
                <Badge className='bg-blue-600/20 text-blue-300 border border-blue-500/40'>
                    Hoàn thành
                </Badge>
            )
        case 'DROPPED':
            return (
                <Badge className='bg-red-600/20 text-red-300 border border-red-500/40'>
                    Đã hủy
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-600/20 text-gray-300 border border-gray-500/40'>
                    {status}
                </Badge>
            )
    }
}

export function InstructorEnrollmentsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [courses, setCourses] = useState<Course[]>([])

    // Filters state
    const [filters, setFilters] = useState<InstructorEnrollmentFilters>({
        page: parseInt(searchParams.get('page') || '1'),
        limit: 20,
        courseId: (() => {
            const courseIdParam = searchParams.get('courseId')
            if (courseIdParam) {
                const parsed = parseInt(courseIdParam)
                return isNaN(parsed) ? undefined : parsed
            }
            return undefined
        })(),
        status: searchParams.get('status') || undefined,
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
    const { enrollments, pagination, isLoading } =
        useInstructorEnrollments(filters)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.page && filters.page > 1)
            params.set('page', filters.page.toString())
        if (filters.courseId)
            params.set('courseId', filters.courseId.toString())
        if (filters.status) params.set('status', filters.status)
        if (filters.startDate) params.set('startDate', filters.startDate)
        if (filters.endDate) params.set('endDate', filters.endDate)
        if (filters.sort && filters.sort !== 'newest')
            params.set('sort', filters.sort)
        if (filters.search) params.set('search', filters.search)

        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (key: keyof InstructorEnrollmentFilters, value: any) => {
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
                            Học viên đã đăng ký
                        </h1>
                        <p className='text-base text-gray-300 leading-relaxed'>
                            Xem danh sách học viên đã đăng ký các khóa học của
                            bạn
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                {/* Filters */}
                <div className='mb-6 space-y-4'>
                    <div className='flex flex-wrap items-center gap-4'>
                        {/* Course Filter */}
                        <div className='flex items-center gap-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                                Khóa học:
                            </label>
                            <Select
                                value={
                                    filters.courseId
                                        ? filters.courseId.toString()
                                        : 'all'
                                }
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        handleFilterChange(
                                            'courseId',
                                            undefined
                                        )
                                    } else {
                                        const parsed = parseInt(value)
                                        if (!isNaN(parsed)) {
                                            handleFilterChange(
                                                'courseId',
                                                parsed
                                            )
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className='w-[250px] bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                                    <SelectValue placeholder='Tất cả khóa học' />
                                </SelectTrigger>
                                <SelectContent className='bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                                    <SelectItem value='all'>
                                        Tất cả khóa học
                                    </SelectItem>
                                    {courses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id.toString()}
                                        >
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className='flex items-center gap-2'>
                            <label className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                                Trạng thái:
                            </label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'status',
                                        value === 'all' ? undefined : value
                                    )
                                }
                            >
                                <SelectTrigger className='w-[180px] bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                                    <SelectValue placeholder='Tất cả' />
                                </SelectTrigger>
                                <SelectContent className='bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                                    <SelectItem value='all'>Tất cả</SelectItem>
                                    <SelectItem value='ACTIVE'>
                                        Đang học
                                    </SelectItem>
                                    <SelectItem value='COMPLETED'>
                                        Hoàn thành
                                    </SelectItem>
                                    <SelectItem value='DROPPED'>
                                        Đã hủy
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search */}
                        <div className='flex-1 min-w-[200px]'>
                            <input
                                type='text'
                                placeholder='Tìm kiếm theo tên, email học viên...'
                                value={filters.search || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'search',
                                        e.target.value || undefined
                                    )
                                }
                                className='w-full px-4 py-2 bg-[#1f1f1f] border border-[#2d2d2d] rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                    </div>
                </div>

                {/* Enrollments Table */}
                <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg overflow-hidden'>
                    <DarkOutlineTable>
                        <DarkOutlineTableHeader>
                            <DarkOutlineTableRow>
                                <DarkOutlineTableHead>
                                    Học viên
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead>
                                    Khóa học
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead>
                                    Trạng thái
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead>
                                    Tiến độ
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead>
                                    Ngày đăng ký
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead>
                                    Lần truy cập cuối
                                </DarkOutlineTableHead>
                            </DarkOutlineTableRow>
                        </DarkOutlineTableHeader>
                        <DarkOutlineTableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <DarkOutlineTableRow key={i}>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Skeleton className='h-12 w-full' />
                                        </DarkOutlineTableCell>
                                    </DarkOutlineTableRow>
                                ))
                            ) : enrollments.length === 0 ? (
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableCell
                                        colSpan={6}
                                        className='text-center py-8 text-gray-400'
                                    >
                                        Không có học viên nào
                                    </DarkOutlineTableCell>
                                </DarkOutlineTableRow>
                            ) : (
                                enrollments.map((enrollment) => {
                                    const progress =
                                        typeof enrollment.progressPercentage ===
                                        'string'
                                            ? parseFloat(
                                                  enrollment.progressPercentage
                                              ) || 0
                                            : enrollment.progressPercentage || 0

                                    return (
                                        <DarkOutlineTableRow
                                            key={enrollment.id}
                                        >
                                            <DarkOutlineTableCell>
                                                <div className='flex items-center gap-3'>
                                                    <Avatar className='h-10 w-10'>
                                                        <AvatarImage
                                                            src={
                                                                enrollment.user
                                                                    ?.avatarUrl
                                                            }
                                                        />
                                                        <AvatarFallback className='bg-blue-600 text-white'>
                                                            {enrollment.user?.fullName
                                                                ?.split(' ')
                                                                .map(
                                                                    (n) => n[0]
                                                                )
                                                                .join('')
                                                                .toUpperCase() ||
                                                                'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className='text-white font-medium'>
                                                            {enrollment.user
                                                                ?.fullName ||
                                                                'N/A'}
                                                        </p>
                                                        <p className='text-xs text-gray-400'>
                                                            {
                                                                enrollment.user
                                                                    ?.email
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                <p className='text-white font-medium'>
                                                    {enrollment.course?.title ||
                                                        'N/A'}
                                                </p>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                {getStatusBadge(
                                                    enrollment.status
                                                )}
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                <div className='space-y-1'>
                                                    <div className='flex items-center justify-between text-xs'>
                                                        <span className='text-gray-400'>
                                                            Tiến độ
                                                        </span>
                                                        <span className='text-white font-medium'>
                                                            {Math.round(
                                                                progress
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={progress}
                                                        className='h-2'
                                                    />
                                                </div>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell className='text-sm text-gray-400'>
                                                {formatDateTime(
                                                    enrollment.enrolledAt
                                                )}
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell className='text-sm text-gray-400'>
                                                {enrollment.lastAccessedAt
                                                    ? formatDateTime(
                                                          enrollment.lastAccessedAt
                                                      )
                                                    : 'Chưa truy cập'}
                                            </DarkOutlineTableCell>
                                        </DarkOutlineTableRow>
                                    )
                                })
                            )}
                        </DarkOutlineTableBody>
                    </DarkOutlineTable>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && renderPagination()}
            </div>
        </div>
    )
}
