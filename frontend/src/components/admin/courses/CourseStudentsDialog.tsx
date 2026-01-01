import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DarkOutlineButton } from '@/components/ui/buttons'
import { DarkOutlineInput } from '@/components/ui/dark-outline-input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectValue,
} from '@/components/ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '@/components/ui/dark-outline-select-trigger'
import { Loader2, Search, Users, GraduationCap, Calendar, TrendingUp, ArrowUpDown, CheckCircle, Trash2, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { instructorCoursesApi } from '@/lib/api/instructor-courses'
import { usersApi } from '@/lib/api/users'
import { toast } from 'sonner'
import type { Enrollment, EnrollmentStatus } from '@/lib/api/types'
import type { AdminCourse } from '@/lib/api/admin-courses'

interface CourseStudentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    course: AdminCourse | null
}

interface CourseEnrollmentsResponse {
    enrollments: Enrollment[]
    totalEnrollments: number
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

const getStatusBadge = (status: EnrollmentStatus) => {
    switch (status) {
        case 'COMPLETED':
            return 'secondary'
        case 'ACTIVE':
            return 'default'
        case 'DROPPED':
            return 'destructive'
        default:
            return 'outline'
    }
}

const getRoleLabel = (role?: string) => {
    switch (role) {
        case 'ADMIN':
            return 'Quản trị viên'
        case 'INSTRUCTOR':
            return 'Giảng viên'
        case 'STUDENT':
            return 'Học viên'
        default:
            return role || '---'
    }
}

const getRoleBadgeClass = (role?: string) => {
    switch (role) {
        case 'ADMIN':
            return 'border-red-500 text-red-300'
        case 'INSTRUCTOR':
            return 'border-blue-500 text-blue-300'
        case 'STUDENT':
            return 'border-green-500 text-green-300'
        default:
            return 'border-gray-500 text-gray-300'
    }
}

export function CourseStudentsDialog({
    open,
    onOpenChange,
    course,
}: CourseStudentsDialogProps) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(false)
    const [searchInput, setSearchInput] = useState('')
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 8,
        total: 0,
        totalPages: 0,
    })
    const [totalEnrollments, setTotalEnrollments] = useState(0)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 8,
        search: '',
        status: '' as '' | 'ACTIVE' | 'COMPLETED' | 'DROPPED',
        sort: 'newest' as 'newest' | 'oldest' | 'progress' | 'lastAccessed',
    })
    const [pendingRemoval, setPendingRemoval] = useState<Enrollment | null>(null)
    const [removingEnrollmentId, setRemovingEnrollmentId] = useState<number | null>(null)

    useEffect(() => {
        if (open && course?.id) {
            fetchEnrollments({ page: 1, search: '' })
        }
    }, [open, course?.id])

    const fetchEnrollments = async (overrides: Partial<typeof filters> = {}) => {
        if (!course) return

        const nextFilters = { ...filters, ...overrides }
        setFilters(nextFilters)

        try {
            setLoading(true)
            
            // Prepare API parameters, exclude empty status
            const apiParams = {
                page: nextFilters.page,
                limit: nextFilters.limit,
                search: nextFilters.search,
                sort: nextFilters.sort,
                ...(nextFilters.status && { status: nextFilters.status }),
            }
            
            const data = await instructorCoursesApi.getCourseEnrollments(
                course.id.toString(),
                apiParams
            )
            
            console.log('Enrollment data:', data) // Debug log
            
            setEnrollments(data.enrollments || [])
            setPagination(data.pagination || {
                page: nextFilters.page,
                limit: nextFilters.limit,
                total: 0,
                totalPages: 0,
            })
            setTotalEnrollments(data.totalEnrollments || 0)
        } catch (error) {
            console.error('Error loading enrollments:', error)
            toast.error('Không thể tải danh sách học viên')
            // Set empty state on error
            setEnrollments([])
            setPagination({
                page: 1,
                limit: 8,
                total: 0,
                totalPages: 0,
            })
            setTotalEnrollments(0)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        fetchEnrollments({ page: 1, search: searchInput.trim() })
    }

    const handlePageChange = (page: number) => {
        fetchEnrollments({ page })
    }

    const handleRemoveEnrollment = async (enrollmentId: number) => {
        const enrollment = enrollments.find(e => e.id === enrollmentId)
        if (!enrollment?.userId) {
            toast.error('Không tìm thấy thông tin học viên')
            return
        }

        try {
            setRemovingEnrollmentId(enrollmentId)
            await usersApi.deleteUserEnrollment(enrollment.userId, enrollmentId)
            toast.success('Đã xóa học viên khỏi khóa học')
            // Refresh danh sách
            fetchEnrollments()
        } catch (error) {
            console.error('Error removing enrollment:', error)
            toast.error('Không thể xóa học viên khỏi khóa học')
        } finally {
            setRemovingEnrollmentId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                wide
                className='bg-[#0A0A0A] border-[#2D2D2D] text-white w-[95vw] max-w-7xl h-[92vh] max-h-[92vh] p-0 overflow-hidden flex flex-col'
            >
                {/* Header Section */}
                <div className='px-6 py-4 border-b border-[#2D2D2D] bg-gradient-to-r from-[#1A1A1A] to-[#141414] flex-shrink-0'>
                    <div className='flex items-start justify-between gap-4'>
                        {/* Course Info with Thumbnail */}
                        <div className='flex items-start gap-3 flex-1'>
                            {course?.thumbnailUrl && (
                                <img
                                    src={course.thumbnailUrl}
                                    alt={course.title}
                                    className='h-16 w-24 rounded-lg object-cover border-2 border-[#2D2D2D] flex-shrink-0'
                                />
                            )}
                            <div className='flex-1 min-w-0'>
                                <DialogTitle className='flex items-center gap-2 text-xl font-semibold mb-2'>
                                    <Users className='h-6 w-6 text-blue-400 flex-shrink-0' />
                                    <span className='truncate'>{course?.title}</span>
                                </DialogTitle>
                                <DialogDescription className='text-gray-400 text-sm flex items-center gap-2'>
                                    <GraduationCap className='h-4 w-4 flex-shrink-0' />
                                    Giảng viên: {course?.instructor?.fullName || 'N/A'}
                                </DialogDescription>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className='flex gap-3 flex-shrink-0'>
                            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg px-4 py-2.5 min-w-[120px]'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <Users className='h-4 w-4 text-blue-400' />
                                    <span className='text-xs text-gray-400'>Tổng học viên</span>
                                </div>
                                <div className='text-2xl font-bold text-white'>{totalEnrollments}</div>
                            </div>
                            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg px-4 py-2.5 min-w-[120px]'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <TrendingUp className='h-4 w-4 text-green-400' />
                                    <span className='text-xs text-gray-400'>Đang học</span>
                                </div>
                                <div className='text-2xl font-bold text-white'>
                                    {enrollments.filter(e => e.status === 'ACTIVE').length}
                                </div>
                            </div>
                            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg px-4 py-2.5 min-w-[120px]'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <CheckCircle className='h-4 w-4 text-emerald-400' />
                                    <span className='text-xs text-gray-400'>Hoàn thành</span>
                                </div>
                                <div className='text-2xl font-bold text-white'>
                                    {totalEnrollments > 0 
                                        ? Math.round((enrollments.filter(e => e.status === 'COMPLETED').length / totalEnrollments) * 100)
                                        : 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className='px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex-shrink-0'>
                    <div className='flex items-center gap-3'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <DarkOutlineInput
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder='Tìm kiếm theo tên, email...'
                                className='pl-10 pr-4 h-10'
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch()
                                    }
                                }}
                            />
                        </div>
                        
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value: any) => {
                                const status = value === 'all' ? '' : value
                                fetchEnrollments({ status: status as any, page: 1 })
                            }}
                        >
                            <DarkOutlineSelectTrigger className='w-[180px] h-10'>
                                <div className='flex items-center gap-2'>
                                    <Filter className='h-4 w-4' />
                                    <SelectValue />
                                </div>
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent position='popper' sideOffset={5}>
                                <DarkOutlineSelectItem value='all'>Tất cả trạng thái</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='ACTIVE'>Đang học</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='COMPLETED'>Hoàn thành</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='DROPPED'>Đã hủy</DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>
                        
                        <Select
                            value={filters.sort}
                            onValueChange={(value: any) => fetchEnrollments({ sort: value, page: 1 })}
                        >
                            <DarkOutlineSelectTrigger className='w-[180px] h-10'>
                                <div className='flex items-center gap-2'>
                                    <ArrowUpDown className='h-4 w-4' />
                                    <SelectValue />
                                </div>
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent position='popper' sideOffset={5}>
                                <DarkOutlineSelectItem value='newest'>Mới nhất</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='oldest'>Cũ nhất</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='progress'>Tiến độ cao</DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='lastAccessed'>Truy cập gần đây</DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>

                        <Button
                            onClick={handleSearch}
                            className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-6'
                            disabled={loading}
                        >
                            {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Tìm'}
                        </Button>
                    </div>
                </div>

                {/* Content Section */}
                <div className='flex-1 overflow-y-auto px-6 py-4'>
                    {loading ? (
                        <div className='flex items-center justify-center h-full'>
                            <div className='text-center space-y-3'>
                                <Loader2 className='h-10 w-10 animate-spin text-blue-400 mx-auto' />
                                <p className='text-gray-400'>Đang tải danh sách học viên...</p>
                            </div>
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className='flex items-center justify-center h-full'>
                            <div className='text-center space-y-3'>
                                <Users className='h-16 w-16 text-gray-600 mx-auto' />
                                <p className='text-gray-400 text-lg'>Chưa có học viên nào đăng ký</p>
                            </div>
                        </div>
                    ) : (
                        <div className='grid gap-4'>
                            {enrollments.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    className='bg-[#141414] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#3D3D3D] transition-all'
                                >
                                    <div className='flex items-center gap-4'>
                                        {/* Avatar & Info */}
                                        <Avatar className='h-12 w-12 border-2 border-[#2D2D2D]'>
                                            <AvatarImage src={enrollment.user?.avatarUrl} />
                                            <AvatarFallback className='bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-semibold'>
                                                {enrollment.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <h4 className='font-semibold text-white text-base truncate'>
                                                    {enrollment.user?.fullName || 'N/A'}
                                                </h4>
                                                <Badge
                                                    variant='outline'
                                                    className={`${getRoleBadgeClass(enrollment.user?.role)} text-xs`}
                                                >
                                                    {getRoleLabel(enrollment.user?.role)}
                                                </Badge>
                                                <Badge variant={getStatusBadge(enrollment.status)} className='text-xs'>
                                                    {enrollment.status === 'COMPLETED'
                                                        ? 'Hoàn thành'
                                                        : enrollment.status === 'ACTIVE'
                                                        ? 'Đang học'
                                                        : 'Đã hủy'}
                                                </Badge>
                                            </div>
                                            <p className='text-sm text-gray-400 truncate'>
                                                {enrollment.user?.email || 'N/A'}
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className='w-48'>
                                            <div className='flex items-center justify-between mb-1.5'>
                                                <span className='text-xs text-gray-400'>Tiến độ học tập</span>
                                                <span className='text-sm font-semibold text-white'>
                                                    {Math.round(enrollment.progressPercentage)}%
                                                </span>
                                            </div>
                                            <Progress 
                                                value={enrollment.progressPercentage} 
                                                className='h-2 bg-[#242424]'
                                            />
                                        </div>

                                        {/* Dates */}
                                        <div className='flex flex-col gap-2 min-w-[160px]'>
                                            <div className='flex items-center gap-2 text-xs'>
                                                <Calendar className='h-3.5 w-3.5 text-gray-500' />
                                                <span className='text-gray-400'>Đăng ký:</span>
                                                <span className='text-gray-300'>
                                                    {formatDate(enrollment.enrolledAt)}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-2 text-xs'>
                                                <Calendar className='h-3.5 w-3.5 text-gray-500' />
                                                <span className='text-gray-400'>Truy cập:</span>
                                                <span className='text-gray-300'>
                                                    {enrollment.lastAccessedAt
                                                        ? formatDate(enrollment.lastAccessedAt)
                                                        : 'Chưa truy cập'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <div className='flex-shrink-0'>
                                            <Button
                                                variant='default'
                                                size='sm'
                                                className='bg-red-600 text-white hover:bg-red-700'
                                                onClick={() => setPendingRemoval(enrollment)}
                                                disabled={removingEnrollmentId === enrollment.id || loading}
                                            >
                                                {removingEnrollmentId === enrollment.id ? (
                                                    <Loader2 className='h-4 w-4 animate-spin' />
                                                ) : (
                                                    <>
                                                        <Trash2 className='h-4 w-4 mr-1' />
                                                        Xóa
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                {pagination.totalPages > 1 && !loading && (
                    <div className='px-6 py-4 border-t border-[#2D2D2D] bg-[#141414] flex items-center justify-between flex-shrink-0'>
                        <span className='text-sm text-gray-400'>
                            Hiển thị {enrollments.length} / {totalEnrollments} học viên
                        </span>
                        <div className='flex items-center gap-2'>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page === 1}
                            >
                                Đầu
                            </DarkOutlineButton>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                Trước
                            </DarkOutlineButton>
                            <span className='text-sm text-white px-3'>
                                Trang {pagination.page} / {pagination.totalPages}
                            </span>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                            >
                                Sau
                            </DarkOutlineButton>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.page === pagination.totalPages}
                            >
                                Cuối
                            </DarkOutlineButton>
                        </div>
                    </div>
                )}

                {/* Confirm delete dialog */}
                <Dialog
                    open={!!pendingRemoval}
                    onOpenChange={(open) =>
                        setPendingRemoval(open ? pendingRemoval : null)
                    }
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md'>
                        <DialogHeader>
                            <DialogTitle className='text-lg text-red-400'>
                                Cảnh báo xóa học viên khỏi khóa
                            </DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Hành động này sẽ hủy đăng ký và xóa tiến độ học liên quan của học viên. Bạn chắc chắn?
                            </DialogDescription>
                        </DialogHeader>

                        <div className='flex flex-col gap-3 text-sm text-gray-300'>
                            <div className='flex items-center justify-between'>
                                <span>Học viên</span>
                                <span className='text-white font-medium'>
                                    {pendingRemoval?.user?.fullName || '---'}
                                </span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span>Khóa học</span>
                                <span className='text-white font-medium'>
                                    {course?.title || '---'}
                                </span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span>Tiến độ hiện tại</span>
                                <span className='text-white font-medium'>
                                    {pendingRemoval ? Math.round(pendingRemoval.progressPercentage) : 0}%
                                </span>
                            </div>
                        </div>

                        <div className='flex justify-end gap-2 pt-2'>
                            <Button
                                variant='ghost'
                                className='text-gray-200 hover:bg-[#2A2A2A]'
                                onClick={() => setPendingRemoval(null)}
                                disabled={!!removingEnrollmentId}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant='default'
                                className='bg-red-600 text-white hover:bg-red-700'
                                onClick={() => {
                                    if (pendingRemoval) {
                                        handleRemoveEnrollment(pendingRemoval.id)
                                    }
                                    setPendingRemoval(null)
                                }}
                                disabled={!!removingEnrollmentId}
                            >
                                {removingEnrollmentId ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    'Xác nhận xóa'
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}
