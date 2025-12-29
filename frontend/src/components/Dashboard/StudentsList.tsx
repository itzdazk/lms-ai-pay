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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import {
    Loader2,
    Search,
    Users,
    Clock,
    BookOpen,
    Eye,
    Copy,
    CheckCircle2,
    X,
    TrendingUp,
} from 'lucide-react'
import { useInstructorStudents } from '../../hooks/useInstructorStudents'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import type { Course } from '../../lib/api/types'
import type { Student } from '../../lib/api/instructor-dashboard'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'

interface StudentsListProps {
    className?: string
}

// Student Detail Modal Component
interface StudentDetailModalProps {
    student: Student | null
    isOpen: boolean
    onClose: () => void
}

function StudentDetailModal({
    student,
    isOpen,
    onClose,
}: StudentDetailModalProps) {
    const [copied, setCopied] = useState(false)

    if (!student) return null

    const copyEmail = () => {
        if (student.user.email) {
            navigator.clipboard.writeText(student.user.email)
            setCopied(true)
            toast.success('Đã sao chép email')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Calculate average progress
    const avgProgress =
        student.enrollments.length > 0
            ? student.enrollments.reduce(
                  (sum, e) => sum + e.progressPercentage,
                  0
              ) / student.enrollments.length
            : 0

    // Calculate total study time (estimate: assume 1 hour per 10% progress)
    const totalStudyHours = student.enrollments.reduce(
        (sum, e) => sum + e.progressPercentage / 10,
        0
    )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='text-white flex items-center gap-3'>
                        <Avatar className='h-12 w-12'>
                            <AvatarImage
                                src={student.user.avatarUrl || undefined}
                                alt={student.user.fullName}
                            />
                            <AvatarFallback className='bg-blue-600 text-white'>
                                {student.user.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div>{student.user.fullName}</div>
                            <div className='text-sm font-normal text-gray-400'>
                                @{student.user.userName}
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription className='text-gray-400'>
                        Thông tin chi tiết học viên
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-6 mt-4'>
                    {/* Student Info */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='bg-[#1F1F1F] rounded-lg p-4'>
                            <p className='text-sm text-gray-400 mb-1'>Email</p>
                            <div className='flex items-center gap-2'>
                                <p className='text-white'>
                                    {student.user.email}
                                </p>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={copyEmail}
                                    className='h-6 w-6 p-0'
                                >
                                    {copied ? (
                                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                                    ) : (
                                        <Copy className='h-4 w-4 text-gray-400' />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className='bg-[#1F1F1F] rounded-lg p-4'>
                            <p className='text-sm text-gray-400 mb-1'>
                                Tổng khóa học
                            </p>
                            <p className='text-2xl font-bold text-white'>
                                {student.totalEnrollments}
                            </p>
                        </div>
                        <div className='bg-[#1F1F1F] rounded-lg p-4'>
                            <p className='text-sm text-gray-400 mb-1'>
                                Tiến độ trung bình
                            </p>
                            <p className='text-2xl font-bold text-white'>
                                {avgProgress.toFixed(1)}%
                            </p>
                        </div>
                        <div className='bg-[#1F1F1F] rounded-lg p-4'>
                            <p className='text-sm text-gray-400 mb-1'>
                                Tổng thời gian học (ước tính)
                            </p>
                            <p className='text-2xl font-bold text-white'>
                                {totalStudyHours.toFixed(1)}h
                            </p>
                        </div>
                    </div>

                    {/* Enrollments List */}
                    <div>
                        <h3 className='text-lg font-semibold text-white mb-4'>
                            Khóa học đã đăng ký
                        </h3>
                        <div className='space-y-3'>
                            {student.enrollments.map((enrollment) => (
                                <div
                                    key={enrollment.courseId}
                                    className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4'
                                >
                                    <div className='flex items-start justify-between mb-3'>
                                        <div className='flex-1'>
                                            <h4 className='font-medium text-white mb-1'>
                                                {enrollment.courseTitle}
                                            </h4>
                                            <p className='text-sm text-gray-400'>
                                                Đăng ký:{' '}
                                                {format(
                                                    new Date(
                                                        enrollment.enrolledAt
                                                    ),
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                enrollment.status === 'ACTIVE'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : enrollment.status ===
                                                      'COMPLETED'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                            }`}
                                        >
                                            {enrollment.status === 'ACTIVE'
                                                ? 'Đang học'
                                                : enrollment.status ===
                                                  'COMPLETED'
                                                ? 'Hoàn thành'
                                                : enrollment.status}
                                        </span>
                                    </div>
                                    <div className='space-y-2'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-sm text-gray-400'>
                                                Tiến độ
                                            </span>
                                            <span className='text-sm font-medium text-white'>
                                                {enrollment.progressPercentage.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                        <Progress
                                            value={
                                                enrollment.progressPercentage
                                            }
                                            className='h-2'
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function StudentsList({ className }: StudentsListProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
    const [selectedCourseId, setSelectedCourseId] = useState<
        number | undefined
    >(
        searchParams.get('courseId')
            ? parseInt(searchParams.get('courseId')!)
            : undefined
    )
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
        searchParams.get('status') || undefined
    )
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [courses, setCourses] = useState<Course[]>([])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
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

    // Memoize filters
    const filters = useMemo(
        () => ({
            page,
            limit: 20,
            search: debouncedSearch || undefined,
        }),
        [page, debouncedSearch]
    )

    const { students, pagination, isLoading } = useInstructorStudents(filters)

    // Calculate stats from students data
    const stats = useMemo(() => {
        const total = pagination.total
        const active = students.filter((s) =>
            s.enrollments.some((e) => e.status === 'ACTIVE')
        ).length
        const completed = students.filter((s) =>
            s.enrollments.some((e) => e.status === 'COMPLETED')
        ).length
        // Estimate total study hours (1 hour per 10% progress)
        const totalHours = students.reduce((sum, s) => {
            const studentHours = s.enrollments.reduce(
                (enrollSum, e) => enrollSum + e.progressPercentage / 10,
                0
            )
            return sum + studentHours
        }, 0)

        return { total, active, completed, totalHours }
    }, [students, pagination.total])

    // Filter students by course and status
    const filteredStudents = useMemo(() => {
        let filtered = [...students]

        if (selectedCourseId) {
            filtered = filtered.filter((s) =>
                s.enrollments.some((e) => e.courseId === selectedCourseId)
            )
        }

        if (selectedStatus) {
            filtered = filtered.filter((s) =>
                s.enrollments.some((e) => e.status === selectedStatus)
            )
        }

        return filtered
    }, [students, selectedCourseId, selectedStatus])

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (page > 1) params.set('page', page.toString())
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedCourseId)
            params.set('courseId', selectedCourseId.toString())
        if (selectedStatus) params.set('status', selectedStatus)
        setSearchParams(params, { replace: true })
    }, [
        page,
        debouncedSearch,
        selectedCourseId,
        selectedStatus,
        setSearchParams,
    ])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const clearFilters = useCallback(() => {
        setSearch('')
        setDebouncedSearch('')
        setSelectedCourseId(undefined)
        setSelectedStatus(undefined)
        setPage(1)
    }, [])

    const hasActiveFilters = !!(
        debouncedSearch ||
        selectedCourseId ||
        selectedStatus
    )

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getAverageProgress = (student: Student): number => {
        if (student.enrollments.length === 0) return 0
        return (
            student.enrollments.reduce(
                (sum, e) => sum + e.progressPercentage,
                0
            ) / student.enrollments.length
        )
    }

    const getTotalStudyHours = (student: Student): number => {
        return student.enrollments.reduce(
            (sum, e) => sum + e.progressPercentage / 10,
            0
        )
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
        <div className={`space-y-6 ${className}`}>
            {/* Stats Cards */}
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm text-gray-400'>
                            Tổng học viên
                        </CardTitle>
                        <Users className='h-4 w-4 text-blue-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-3xl text-white'>
                            {isLoading ? (
                                <Loader2 className='h-6 w-6 animate-spin' />
                            ) : (
                                stats.total.toLocaleString()
                            )}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Tất cả học viên
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm text-gray-400'>
                            Đang học
                        </CardTitle>
                        <TrendingUp className='h-4 w-4 text-green-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-3xl text-white'>
                            {isLoading ? (
                                <Loader2 className='h-6 w-6 animate-spin' />
                            ) : (
                                stats.active.toLocaleString()
                            )}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Có khóa học đang học
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm text-gray-400'>
                            Đã hoàn thành
                        </CardTitle>
                        <CheckCircle2 className='h-4 w-4 text-blue-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-3xl text-white'>
                            {isLoading ? (
                                <Loader2 className='h-6 w-6 animate-spin' />
                            ) : (
                                stats.completed.toLocaleString()
                            )}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Có khóa học hoàn thành
                        </p>
                    </CardContent>
                </Card>

                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm text-gray-400'>
                            Tổng giờ học
                        </CardTitle>
                        <Clock className='h-4 w-4 text-yellow-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-3xl text-white'>
                            {isLoading ? (
                                <Loader2 className='h-6 w-6 animate-spin' />
                            ) : (
                                stats.totalHours.toFixed(0)
                            )}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                            Tổng thời gian học (ước tính)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Danh sách học viên
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Quản lý và xem thông tin học viên đã đăng ký khóa học
                        của bạn
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
                                    placeholder='Tìm kiếm theo tên, email hoặc username...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                />
                            </div>

                            {/* Course Filter */}
                            <Select
                                value={selectedCourseId?.toString() || 'all'}
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        setSelectedCourseId(undefined)
                                    } else {
                                        setSelectedCourseId(parseInt(value))
                                    }
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className='w-[250px] bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                    <SelectValue placeholder='Tất cả khóa học' />
                                </SelectTrigger>
                                <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <SelectItem
                                        value='all'
                                        className='text-white'
                                    >
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
                                value={selectedStatus || 'all'}
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        setSelectedStatus(undefined)
                                    } else {
                                        setSelectedStatus(value)
                                    }
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className='w-[180px] bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                    <SelectValue placeholder='Tất cả trạng thái' />
                                </SelectTrigger>
                                <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <SelectItem
                                        value='all'
                                        className='text-white'
                                    >
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

                    {/* Students Table */}
                    {isLoading ? (
                        <div className='flex items-center justify-center py-12'>
                            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-12'>
                            <Users className='h-12 w-12 text-gray-400 mb-4' />
                            <p className='text-gray-400'>
                                {hasActiveFilters
                                    ? 'Không tìm thấy học viên nào'
                                    : 'Chưa có học viên đăng ký'}
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
                                                Số khóa học
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Tiến độ TB
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Thời gian học
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Thao tác
                                            </DarkOutlineTableHead>
                                        </DarkOutlineTableRow>
                                    </DarkOutlineTableHeader>
                                    <DarkOutlineTableBody>
                                        {filteredStudents.map((student) => {
                                            const avgProgress =
                                                getAverageProgress(student)
                                            const totalHours =
                                                getTotalStudyHours(student)
                                            return (
                                                <DarkOutlineTableRow
                                                    key={student.user.id}
                                                >
                                                    <DarkOutlineTableCell>
                                                        <div className='flex items-center gap-3'>
                                                            <Avatar className='h-10 w-10'>
                                                                <AvatarImage
                                                                    src={
                                                                        student
                                                                            .user
                                                                            .avatarUrl ||
                                                                        undefined
                                                                    }
                                                                    alt={
                                                                        student
                                                                            .user
                                                                            .fullName
                                                                    }
                                                                />
                                                                <AvatarFallback className='bg-blue-600 text-white'>
                                                                    {getInitials(
                                                                        student
                                                                            .user
                                                                            .fullName
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className='font-medium text-white'>
                                                                    {
                                                                        student
                                                                            .user
                                                                            .fullName
                                                                    }
                                                                </p>
                                                                <p className='text-sm text-gray-400'>
                                                                    {
                                                                        student
                                                                            .user
                                                                            .email
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DarkOutlineTableCell>
                                                    <DarkOutlineTableCell>
                                                        <div className='flex items-center gap-2'>
                                                            <BookOpen className='h-4 w-4 text-gray-400' />
                                                            <span className='text-gray-300'>
                                                                {
                                                                    student.totalEnrollments
                                                                }
                                                            </span>
                                                        </div>
                                                    </DarkOutlineTableCell>
                                                    <DarkOutlineTableCell>
                                                        <div className='flex items-center gap-2 min-w-[150px]'>
                                                            <Progress
                                                                value={
                                                                    avgProgress
                                                                }
                                                                className='flex-1 h-2'
                                                            />
                                                            <span className='text-sm text-gray-300 min-w-[50px] text-right'>
                                                                {avgProgress.toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                    </DarkOutlineTableCell>
                                                    <DarkOutlineTableCell>
                                                        <div className='flex items-center gap-2'>
                                                            <Clock className='h-4 w-4 text-gray-400' />
                                                            <span className='text-gray-300'>
                                                                {totalHours.toFixed(
                                                                    1
                                                                )}
                                                                h
                                                            </span>
                                                        </div>
                                                    </DarkOutlineTableCell>
                                                    <DarkOutlineTableCell>
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            onClick={() =>
                                                                setSelectedStudent(
                                                                    student
                                                                )
                                                            }
                                                            className='text-blue-500 hover:text-blue-400'
                                                        >
                                                            <Eye className='h-4 w-4 mr-1' />
                                                            Xem chi tiết
                                                        </Button>
                                                    </DarkOutlineTableCell>
                                                </DarkOutlineTableRow>
                                            )
                                        })}
                                    </DarkOutlineTableBody>
                                </DarkOutlineTable>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && renderPagination()}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Student Detail Modal */}
            <StudentDetailModal
                student={selectedStudent}
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
            />
        </div>
    )
}
