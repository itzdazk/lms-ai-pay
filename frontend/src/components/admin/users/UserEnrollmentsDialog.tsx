import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { DarkOutlineButton } from '@/components/ui/buttons'
import { DarkOutlineInput } from '@/components/ui/dark-outline-input'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '@/components/ui/dark-outline-table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, Search, BookOpen } from 'lucide-react'
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
                className='bg-[#1A1A1A] border-[#2D2D2D] text-white w-[92vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-y-auto px-4 py-3 sm:px-5 sm:py-4'
            >
                <DialogHeader className='pb-1 space-y-0.5'>
                    <DialogTitle className='flex items-center gap-2 text-base sm:text-lg'>
                        <BookOpen className='h-5 w-5 text-blue-400' />
                        Khóa học đã đăng ký
                    </DialogTitle>
                    <DialogDescription className='text-gray-400 text-[11px] sm:text-xs'>
                        Xem danh sách khóa học mà {user?.fullName} đã đăng ký
                    </DialogDescription>
                </DialogHeader>

                <Card className='bg-[#141414] border-[#2D2D2D] shadow-lg'>
                    <CardHeader className='pb-2 pt-2 px-2 sm:px-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-center gap-2'>
                            <Avatar className='h-8 w-8'>
                                <AvatarImage src={user?.avatarUrl || user?.avatar} />
                                <AvatarFallback className='bg-blue-600 text-white'>
                                    {initials || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0'>
                                <CardTitle className='text-white text-sm sm:text-base leading-tight truncate'>
                                    {user?.fullName}
                                </CardTitle>
                                <CardDescription className='text-[11px] sm:text-xs text-gray-400 truncate leading-tight'>
                                    @{user?.userName} • {user?.email}
                                </CardDescription>
                                <div className='flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-gray-400'>
                                    <Badge
                                        variant='outline'
                                        className={getRoleBadgeClass(user?.role)}
                                    >
                                        {getRoleLabel(user?.role)}
                                    </Badge>
                                    <span className='text-gray-500'>
                                        Tham gia từ {user ? formatDate(user.createdAt) : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col items-start sm:items-end text-[11px] sm:text-xs text-gray-400 gap-0.5'>
                            <span>Tổng: {totalEnrollments ?? pagination.total} khóa đăng ký</span>
                            <span>Trang {pagination.page}/{pagination.totalPages}</span>
                        </div>
                    </CardHeader>

                    <CardContent className='space-y-3 pt-0 px-2 sm:px-3 pb-3'>
                        <div className='flex items-center gap-2'>
                            <div className='relative flex-1'>
                                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                <DarkOutlineInput
                                    value={search}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder='Tìm theo tên khóa học...'
                                    className='pl-10 pr-4'
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onSearch()
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                onClick={onSearch}
                                className='bg-blue-600 hover:bg-blue-700 text-white'
                                disabled={loading}
                            >
                                Tìm kiếm
                            </Button>
                        </div>

                        <div className='border border-[#2D2D2D] rounded-lg overflow-hidden'>
                            <DarkOutlineTable>
                                <DarkOutlineTableHeader>
                                    <DarkOutlineTableRow>
                                        <DarkOutlineTableHead className='text-left'>Khóa học</DarkOutlineTableHead>
                                        <DarkOutlineTableHead className='text-left'>Trạng thái</DarkOutlineTableHead>
                                        <DarkOutlineTableHead className='text-left'>Tiến độ</DarkOutlineTableHead>
                                        <DarkOutlineTableHead className='text-left'>Đăng ký</DarkOutlineTableHead>
                                        <DarkOutlineTableHead className='text-left'>Truy cập gần nhất</DarkOutlineTableHead>
                                        <DarkOutlineTableHead className='text-right'>Thao tác</DarkOutlineTableHead>
                                    </DarkOutlineTableRow>
                                </DarkOutlineTableHeader>
                                <DarkOutlineTableBody>
                                    {loading ? (
                                        <DarkOutlineTableRow>
                                            <DarkOutlineTableCell colSpan={6}>
                                                <div className='flex items-center justify-center py-8 text-gray-400 gap-2'>
                                                    <Loader2 className='h-5 w-5 animate-spin' />
                                                    Đang tải danh sách đăng ký...
                                                </div>
                                            </DarkOutlineTableCell>
                                        </DarkOutlineTableRow>
                                    ) : enrollments.length === 0 ? (
                                        <DarkOutlineTableRow>
                                            <DarkOutlineTableCell colSpan={6}>
                                                <div className='text-center py-8 text-gray-400'>
                                                    Chưa có khóa học nào
                                                </div>
                                            </DarkOutlineTableCell>
                                        </DarkOutlineTableRow>
                                    ) : (
                                        enrollments.map((enrollment) => (
                                            <DarkOutlineTableRow key={enrollment.id}>
                                                <DarkOutlineTableCell>
                                                    <div className='flex items-center gap-3'>
                                                        {enrollment.course?.thumbnailUrl ? (
                                                            <img
                                                                src={enrollment.course.thumbnailUrl}
                                                                alt={enrollment.course.title}
                                                                className='h-12 w-20 rounded object-cover border border-[#2D2D2D]'
                                                            />
                                                        ) : (
                                                            <div className='h-12 w-20 rounded bg-[#242424] border border-[#2D2D2D] flex items-center justify-center text-xs text-gray-500'>
                                                                No image
                                                            </div>
                                                        )}
                                                        <div className='min-w-0'>
                                                            <p className='font-medium text-white truncate'>
                                                                {enrollment.course?.title || 'Không xác định'}
                                                            </p>
                                                            <p className='text-sm text-gray-400 truncate'>
                                                                {enrollment.course?.instructor?.fullName || 'Giảng viên ẩn danh'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <Badge variant={getStatusBadge(enrollment.status)}>
                                                        {enrollment.status === 'COMPLETED'
                                                            ? 'Hoàn thành'
                                                            : enrollment.status === 'ACTIVE'
                                                            ? 'Đang học'
                                                            : 'Đã hủy'}
                                                    </Badge>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <div className='space-y-2'>
                                                        <div className='flex items-center justify-between text-xs text-gray-400'>
                                                            <span>Tiến độ</span>
                                                            <span className='text-white'>
                                                                {Math.round(enrollment.progressPercentage)}%
                                                            </span>
                                                        </div>
                                                        <Progress value={enrollment.progressPercentage} className='h-2 bg-[#242424]' />
                                                    </div>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <div className='text-gray-300 text-sm'>
                                                        {formatDate(enrollment.enrolledAt)}
                                                    </div>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell>
                                                    <div className='text-gray-300 text-sm'>
                                                        {enrollment.lastAccessedAt
                                                            ? formatDate(enrollment.lastAccessedAt)
                                                            : 'Chưa truy cập'}
                                                    </div>
                                                </DarkOutlineTableCell>
                                                <DarkOutlineTableCell className='text-right'>
                                                    <Button
                                                        variant='default'
                                                        size='sm'
                                                        className='bg-red-600 text-white hover:bg-red-700'
                                                        onClick={() =>
                                                            setPendingRemoval(
                                                                enrollment
                                                            )
                                                        }
                                                        disabled={
                                                            removingEnrollmentId ===
                                                                enrollment.id ||
                                                            loading
                                                        }
                                                    >
                                                        {removingEnrollmentId ===
                                                        enrollment.id ? (
                                                            <Loader2 className='h-4 w-4 animate-spin' />
                                                        ) : (
                                                            'Xóa khỏi khóa'
                                                        )}
                                                    </Button>
                                                </DarkOutlineTableCell>
                                            </DarkOutlineTableRow>
                                        ))
                                    )}
                                </DarkOutlineTableBody>
                            </DarkOutlineTable>
                        </div>
                    </CardContent>
                </Card>

                {pagination.totalPages > 1 && (
                    <div className='flex items-center justify-center gap-2 pt-2'>
                        <DarkOutlineButton
                            size='sm'
                            onClick={() => onPageChange(1)}
                            disabled={pagination.page === 1 || loading}
                        >
                            &lt;&lt;
                        </DarkOutlineButton>
                        <DarkOutlineButton
                            size='sm'
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                        >
                            &lt;
                        </DarkOutlineButton>
                        <span className='text-sm text-gray-400'>
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <DarkOutlineButton
                            size='sm'
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={
                                pagination.page === pagination.totalPages ||
                                loading
                            }
                        >
                            &gt;
                        </DarkOutlineButton>
                        <DarkOutlineButton
                            size='sm'
                            onClick={() => onPageChange(pagination.totalPages)}
                            disabled={
                                pagination.page === pagination.totalPages ||
                                loading
                            }
                        >
                            &gt;&gt;
                        </DarkOutlineButton>
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
                                {pendingRemoval?.course?.title ? ` “${pendingRemoval.course.title}”` : ''}. Bạn chắc chắn?
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
