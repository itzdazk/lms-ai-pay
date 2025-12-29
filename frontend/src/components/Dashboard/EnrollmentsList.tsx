import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Progress } from '../ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableBody,
    DarkOutlineTableRow,
    DarkOutlineTableHead,
    DarkOutlineTableCell,
} from '../ui/dark-outline-table'
import { Loader2, Search, Users, X } from 'lucide-react'
import { useInstructorEnrollments } from '../../hooks/useInstructorEnrollments'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import type { Course } from '../../lib/api/types'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatDateTime } from '@/lib/utils'

interface EnrollmentsListProps {
    className?: string
}

export function EnrollmentsList({ className }: EnrollmentsListProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
    const [courseId, setCourseId] = useState<number | undefined>(
        searchParams.get('courseId')
            ? parseInt(searchParams.get('courseId')!)
            : undefined
    )
    const [status, setStatus] = useState<string | undefined>(
        searchParams.get('status') || undefined
    )
    const [sort, setSort] = useState<string>(
        searchParams.get('sort') || 'newest'
    )
    const [courses, setCourses] = useState<Course[]>([])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1) // Reset to first page on search
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

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

    // Memoize filters to prevent infinite loop
    const filters = useMemo(
        () => ({
            page,
            limit: 20,
            search: debouncedSearch || undefined,
            courseId,
            status,
            sort,
        }),
        [page, debouncedSearch, courseId, status, sort]
    )

    const { enrollments, pagination, isLoading } =
        useInstructorEnrollments(filters)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (page > 1) params.set('page', page.toString())
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (courseId) params.set('courseId', courseId.toString())
        if (status) params.set('status', status)
        if (sort && sort !== 'newest') params.set('sort', sort)
        setSearchParams(params, { replace: true })
    }, [page, debouncedSearch, courseId, status, sort, setSearchParams])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const clearFilters = useCallback(() => {
        setSearch('')
        setDebouncedSearch('')
        setCourseId(undefined)
        setStatus(undefined)
        setSort('newest')
        setPage(1)
    }, [])

    const hasActiveFilters = !!(
        debouncedSearch ||
        courseId ||
        status ||
        (sort && sort !== 'newest')
    )

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> =
            {
                ACTIVE: {
                    label: 'Đang học',
                    className: 'bg-green-500/20 text-green-400',
                },
                COMPLETED: {
                    label: 'Hoàn thành',
                    className: 'bg-blue-500/20 text-blue-400',
                },
                EXPIRED: {
                    label: 'Hết hạn',
                    className: 'bg-red-500/20 text-red-400',
                },
                DROPPED: {
                    label: 'Đã hủy',
                    className: 'bg-gray-500/20 text-gray-400',
                },
            }
        const statusInfo = statusMap[status.toUpperCase()] || statusMap.ACTIVE
        return (
            <span
                className={`px-2 py-1 rounded text-xs ${statusInfo.className}`}
            >
                {statusInfo.label}
            </span>
        )
    }

    const getProgressColor = (progress: number): string => {
        if (progress >= 70) return 'bg-green-500'
        if (progress >= 40) return 'bg-yellow-500'
        return 'bg-blue-500'
    }

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
                {pages.map((pageNum, index) => {
                    if (pageNum === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-400'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNumber = pageNum as number
                    return (
                        <DarkOutlineButton
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            disabled={isLoading}
                            size='sm'
                            className={
                                currentPage === pageNumber
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNumber}
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
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <CardTitle className='text-white'>
                    Học viên đã đăng ký
                </CardTitle>
                <CardDescription className='text-gray-400'>
                    Quản lý và xem chi tiết các học viên đã đăng ký khóa học
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className='mb-6 space-y-4'>
                    <div className='flex flex-wrap gap-4'>
                        {/* Search */}
                        <div className='relative flex-1 min-w-[200px]'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <Input
                                type='text'
                                placeholder='Tìm kiếm học viên...'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                            />
                        </div>

                        {/* Course Filter */}
                        <Select
                            value={courseId?.toString() || 'all'}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setCourseId(undefined)
                                } else {
                                    setCourseId(parseInt(value))
                                }
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className='w-[250px] bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Tất cả khóa học' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
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

                        {/* Status Filter */}
                        <Select
                            value={status || 'all'}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    setStatus(undefined)
                                } else {
                                    setStatus(value)
                                }
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className='w-[180px] bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Tất cả trạng thái' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                <SelectItem value='all' className='text-white'>
                                    Tất cả trạng thái
                                </SelectItem>
                                <SelectItem
                                    value='ACTIVE'
                                    className='text-white'
                                >
                                    Đang học
                                </SelectItem>
                                <SelectItem
                                    value='COMPLETED'
                                    className='text-white'
                                >
                                    Hoàn thành
                                </SelectItem>
                                <SelectItem
                                    value='EXPIRED'
                                    className='text-white'
                                >
                                    Hết hạn
                                </SelectItem>
                                <SelectItem
                                    value='DROPPED'
                                    className='text-white'
                                >
                                    Đã hủy
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select
                            value={sort}
                            onValueChange={(value) => {
                                setSort(value)
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className='w-[150px] bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                <SelectItem
                                    value='newest'
                                    className='text-white'
                                >
                                    Mới nhất
                                </SelectItem>
                                <SelectItem
                                    value='oldest'
                                    className='text-white'
                                >
                                    Cũ nhất
                                </SelectItem>
                                <SelectItem
                                    value='progress_asc'
                                    className='text-white'
                                >
                                    Tiến độ ↑
                                </SelectItem>
                                <SelectItem
                                    value='progress_desc'
                                    className='text-white'
                                >
                                    Tiến độ ↓
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={clearFilters}
                                className='bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
                            >
                                <X className='h-4 w-4 mr-1' />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                </div>

                {/* Enrollments Table */}
                {isLoading ? (
                    <div className='flex items-center justify-center py-12'>
                        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                        <Users className='h-12 w-12 text-gray-400 mb-4' />
                        <p className='text-gray-400'>
                            {hasActiveFilters
                                ? 'Không tìm thấy đăng ký nào'
                                : 'Chưa có đăng ký nào'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='overflow-x-auto'>
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
                                            Ngày đăng ký
                                        </DarkOutlineTableHead>
                                        <DarkOutlineTableHead>
                                            Tiến độ
                                        </DarkOutlineTableHead>
                                        <DarkOutlineTableHead>
                                            Trạng thái
                                        </DarkOutlineTableHead>
                                        <DarkOutlineTableHead>
                                            Lần truy cập cuối
                                        </DarkOutlineTableHead>
                                    </DarkOutlineTableRow>
                                </DarkOutlineTableHeader>
                                <DarkOutlineTableBody>
                                    {enrollments.map((enrollment) => (
                                        <DarkOutlineTableRow
                                            key={enrollment.id}
                                        >
                                            <DarkOutlineTableCell>
                                                <div className='flex items-center gap-3'>
                                                    <Avatar className='h-10 w-10'>
                                                        <AvatarImage
                                                            src={
                                                                enrollment.user
                                                                    ?.avatarUrl ||
                                                                undefined
                                                            }
                                                            alt={
                                                                enrollment.user
                                                                    ?.fullName ||
                                                                ''
                                                            }
                                                        />
                                                        <AvatarFallback className='bg-blue-600 text-white'>
                                                            {enrollment.user
                                                                ?.fullName
                                                                ? getInitials(
                                                                      enrollment
                                                                          .user
                                                                          .fullName
                                                                  )
                                                                : 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className='font-medium text-white'>
                                                            {enrollment.user
                                                                ?.fullName ||
                                                                'N/A'}
                                                        </p>
                                                        <p className='text-sm text-gray-400'>
                                                            {enrollment.user
                                                                ?.email ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                <p className='font-medium text-white line-clamp-1 max-w-[200px]'>
                                                    {enrollment.course?.title ||
                                                        'N/A'}
                                                </p>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                <span className='text-gray-300'>
                                                    {/* {format(
                                                        new Date(
                                                            enrollment.enrolledAt
                                                        ),
                                                        'dd/MM/yyyy',
                                                        { locale: vi }
                                                    )} */}
                                                    {formatDateTime(
                                                        enrollment.enrolledAt
                                                    )}
                                                </span>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                <div className='flex items-center gap-2 min-w-[150px]'>
                                                    <Progress
                                                        value={
                                                            enrollment.progressPercentage
                                                        }
                                                        className='flex-1 h-2'
                                                    />
                                                    <span className='text-sm text-gray-300 min-w-[45px] text-right'>
                                                        {Number(
                                                            enrollment.progressPercentage
                                                        ).toFixed(0)}
                                                        %
                                                    </span>
                                                </div>
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                {getStatusBadge(
                                                    enrollment.status
                                                )}
                                            </DarkOutlineTableCell>
                                            <DarkOutlineTableCell>
                                                {enrollment.lastAccessedAt ? (
                                                    <span className='text-gray-300'>
                                                        {format(
                                                            new Date(
                                                                enrollment.lastAccessedAt
                                                            ),
                                                            'dd/MM/yyyy',
                                                            { locale: vi }
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className='text-gray-500'>
                                                        -
                                                    </span>
                                                )}
                                            </DarkOutlineTableCell>
                                        </DarkOutlineTableRow>
                                    ))}
                                </DarkOutlineTableBody>
                            </DarkOutlineTable>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && renderPagination()}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
