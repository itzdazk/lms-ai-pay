import React from 'react'
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
import { Loader2, Search, BookOpen, GraduationCap, Calendar, TrendingUp, CheckCircle, Trash2, User as UserIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Enrollment, EnrollmentStatus, User } from '@/lib/api/types'

interface UserEnrollmentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    enrollments: Enrollment[]
    loading: boolean
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    totalEnrollments?: number
    search: string
    onSearchChange: (value: string) => void
    onSearch: () => void
    onPageChange: (page: number) => void
    onRemoveEnrollment: (enrollmentId: number) => void
    removingEnrollmentId?: number | null
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

export function UserEnrollmentsDialog({
    open,
    onOpenChange,
    user,
    enrollments,
    loading,
    pagination,
    totalEnrollments,
    search,
    onSearchChange,
    onSearch,
    onPageChange,
    onRemoveEnrollment,
    removingEnrollmentId,
}: UserEnrollmentsDialogProps) {
    const [pendingRemoval, setPendingRemoval] = React.useState<Enrollment | null>(null)
    const initials = user?.fullName
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                wide
                className='bg-[#0A0A0A] border-[#2D2D2D] text-white w-[95vw] max-w-7xl h-[92vh] max-h-[92vh] p-0 overflow-hidden flex flex-col'
            >
                {/* Header Section */}
                <div className='px-6 py-4 border-b border-[#2D2D2D] bg-gradient-to-r from-[#1A1A1A] to-[#141414] flex-shrink-0'>
                    <div className='flex items-start justify-between gap-4'>
                        {/* User Info */}
                        <div className='flex items-start gap-3 flex-1'>
                            <Avatar className='h-16 w-16 border-2 border-[#2D2D2D]'>
                                <AvatarImage src={user?.avatarUrl || user?.avatar} />
                                <AvatarFallback className='bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg font-semibold'>
                                    {initials || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                                <DialogTitle className='flex items-center gap-2 text-xl font-semibold mb-2'>
                                    <UserIcon className='h-6 w-6 text-blue-400 flex-shrink-0' />
                                    <span className='truncate'>{user?.fullName}</span>
                                </DialogTitle>
                                <DialogDescription className='text-gray-400 text-sm mb-2'>
                                    @{user?.userName} • {user?.email}
                                </DialogDescription>
                                <div className='flex items-center gap-2'>
                                    <Badge
                                        variant='outline'
                                        className={getRoleBadgeClass(user?.role)}
                                    >
                                        {getRoleLabel(user?.role)}
                                    </Badge>
                                    <span className='text-xs text-gray-500'>
                                        Tham gia từ {user ? formatDate(user.createdAt) : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className='flex gap-3 flex-shrink-0'>
                            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg px-4 py-2.5 min-w-[120px]'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <BookOpen className='h-4 w-4 text-blue-400' />
                                    <span className='text-xs text-gray-400'>Tổng khóa học</span>
                                </div>
                                <div className='text-2xl font-bold text-white'>{totalEnrollments ?? pagination.total}</div>
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
                                    {enrollments.filter(e => e.status === 'COMPLETED').length}
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
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder='Tìm kiếm theo tên khóa học...'
                                className='pl-10 pr-4 h-10'
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onSearch()
                                    }
                                }}
                            />
                        </div>

                        <Button
                            onClick={onSearch}
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
                                <p className='text-gray-400'>Đang tải danh sách khóa học...</p>
                            </div>
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className='flex items-center justify-center h-full'>
                            <div className='text-center space-y-3'>
                                <BookOpen className='h-16 w-16 text-gray-600 mx-auto' />
                                <p className='text-gray-400 text-lg'>Chưa có khóa học nào</p>
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
                                        {/* Course Thumbnail */}
                                        {enrollment.course?.thumbnailUrl ? (
                                            <img
                                                src={enrollment.course.thumbnailUrl}
                                                alt={enrollment.course.title}
                                                className='h-20 w-32 rounded-lg object-cover border-2 border-[#2D2D2D] flex-shrink-0'
                                            />
                                        ) : (
                                            <div className='h-20 w-32 rounded-lg bg-[#242424] border-2 border-[#2D2D2D] flex items-center justify-center flex-shrink-0'>
                                                <BookOpen className='h-8 w-8 text-gray-600' />
                                            </div>
                                        )}

                                        {/* Course Info */}
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <h4 className='font-semibold text-white text-base truncate'>
                                                    {enrollment.course?.title || 'Không xác định'}
                                                </h4>
                                                <Badge variant={getStatusBadge(enrollment.status)} className='text-xs flex-shrink-0'>
                                                    {enrollment.status === 'COMPLETED'
                                                        ? 'Hoàn thành'
                                                        : enrollment.status === 'ACTIVE'
                                                        ? 'Đang học'
                                                        : 'Đã hủy'}
                                                </Badge>
                                            </div>
                                            <p className='text-sm text-gray-400 mb-2 flex items-center gap-2'>
                                                <GraduationCap className='h-3.5 w-3.5' />
                                                {enrollment.course?.instructor?.fullName || 'Giảng viên ẩn danh'}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className='mb-2'>
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
                                        </div>

                                        {/* Dates & Action */}
                                        <div className='flex flex-col gap-3 min-w-[180px] flex-shrink-0'>
                                            <div className='flex flex-col gap-2'>
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
                                            <Button
                                                variant='default'
                                                size='sm'
                                                className='bg-red-600 text-white hover:bg-red-700 w-full'
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
                            Hiển thị {enrollments.length} / {totalEnrollments ?? pagination.total} khóa học
                        </span>
                        <div className='flex items-center gap-2'>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => onPageChange(1)}
                                disabled={pagination.page === 1}
                            >
                                Đầu
                            </DarkOutlineButton>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                Trước
                            </DarkOutlineButton>
                            <span className='text-sm text-white px-3'>
                                Trang {pagination.page} / {pagination.totalPages}
                            </span>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                            >
                                Sau
                            </DarkOutlineButton>
                            <DarkOutlineButton
                                size='sm'
                                onClick={() => onPageChange(pagination.totalPages)}
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
                                Cảnh báo xóa khỏi khóa
                            </DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Hành động này sẽ hủy đăng ký và xóa tiến độ học liên quan của học viên cho khóa
                                {pendingRemoval?.course?.title ? ` "${pendingRemoval.course.title}"` : ''}. Bạn chắc chắn?
                            </DialogDescription>
                        </DialogHeader>

                        <div className='flex flex-col gap-3 text-sm text-gray-300'>
                            <div className='flex items-center justify-between'>
                                <span>Học viên</span>
                                <span className='text-white font-medium'>{user?.fullName}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span>Khóa học</span>
                                <span className='text-white font-medium'>
                                    {pendingRemoval?.course?.title || '---'}
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
                                        onRemoveEnrollment(pendingRemoval.id)
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
