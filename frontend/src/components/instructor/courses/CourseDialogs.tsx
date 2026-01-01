import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DarkOutlineButton } from '@/components/ui/buttons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { CourseAnalytics } from '../../../components/instructor/CourseAnalytics'
import type { Course } from '../../../lib/api/types'

interface CourseDialogsProps {
    // Delete Dialog
    isDeleteDialogOpen: boolean
    setIsDeleteDialogOpen: (open: boolean) => void
    selectedCourse: Course | null
    onDeleteCourse: () => void

    // Analytics Dialog
    isAnalyticsDialogOpen: boolean
    setIsAnalyticsDialogOpen: (open: boolean) => void

    // Status Dialog
    isStatusDialogOpen: boolean
    setIsStatusDialogOpen: (open: boolean) => void
    newStatus: 'draft' | 'published' | 'archived'
    setNewStatus: (status: 'draft' | 'published' | 'archived') => void
    onChangeStatus: () => void

    // Common
    actionLoading: boolean
}

export function CourseDialogs({
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedCourse,
    onDeleteCourse,
    isAnalyticsDialogOpen,
    setIsAnalyticsDialogOpen,
    isStatusDialogOpen,
    setIsStatusDialogOpen,
    newStatus,
    setNewStatus,
    onChangeStatus,
    actionLoading,
}: CourseDialogsProps) {
    return (
        <>
            {/* Delete Course Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Bạn có chắc muốn xóa khóa học "
                            {selectedCourse?.title}"? Hành động này không thể
                            hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                // selectedCourse will be set to null in parent component
                            }}
                            disabled={actionLoading}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={onDeleteCourse}
                            disabled={actionLoading}
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Analytics Dialog */}
            <Dialog
                open={isAnalyticsDialogOpen}
                onOpenChange={setIsAnalyticsDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white w-[96vw] sm:max-w-[96vw] md:max-w-[1400px] lg:max-w-[1600px] max-h-[90vh] overflow-y-auto custom-scrollbar'>
                    <DialogHeader>
                        <DialogTitle className='text-white'>
                            Phân tích khóa học
                        </DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            {selectedCourse?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='mt-4'>
                        {selectedCourse && (
                            <CourseAnalytics
                                courseId={String(selectedCourse.id)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Change Dialog */}
            <Dialog
                open={isStatusDialogOpen}
                onOpenChange={setIsStatusDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Thay đổi trạng thái</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Chọn trạng thái mới cho khóa học{' '}
                            <strong className='text-white'>
                                {selectedCourse?.title}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <Select
                            value={newStatus}
                            onValueChange={(value: any) => setNewStatus(value)}
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D] z-[9999]'>
                                <SelectItem
                                    value='draft'
                                    className='text-white focus:bg-[#2D2D2D]'
                                >
                                    <div className='flex flex-col'>
                                        <span>Bản nháp</span>
                                        <span className='text-xs text-gray-400 mt-0.5'>
                                            Khóa học chưa được công khai, chỉ
                                            bạn có thể xem
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem
                                    value='published'
                                    className='text-white focus:bg-[#2D2D2D]'
                                >
                                    <div className='flex flex-col'>
                                        <span>Xuất bản</span>
                                        <span className='text-xs text-gray-400 mt-0.5'>
                                            Khóa học đã được công khai, học viên
                                            có thể đăng ký
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem
                                    value='archived'
                                    className='text-white focus:bg-[#2D2D2D]'
                                >
                                    <div className='flex flex-col'>
                                        <span>Lưu trữ</span>
                                        <span className='text-xs text-gray-400 mt-0.5'>
                                            Khóa học đã được lưu trữ, không còn
                                            hiển thị công khai
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsStatusDialogOpen(false)
                                // selectedCourse will be set to null in parent component
                            }}
                            disabled={actionLoading}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={onChangeStatus}
                            disabled={actionLoading}
                            className='bg-blue-600 hover:bg-blue-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Cập nhật'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
