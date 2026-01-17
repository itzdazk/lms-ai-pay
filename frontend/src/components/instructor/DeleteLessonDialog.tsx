import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2, AlertTriangle, Users, CheckCircle2 } from 'lucide-react'
import type { Lesson } from '../../lib/api/types'

interface DeleteLessonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deletingLesson: Lesson | null
    progressInfo: {
        totalProgressRecords: number
        completedProgressRecords: number
        uniqueUsersCount: number
    } | null
    loadingProgressInfo?: boolean
    onSubmit: () => Promise<void>
    onCancel: () => void
    submitting: boolean
}

export function DeleteLessonDialog({
    open,
    onOpenChange,
    deletingLesson,
    progressInfo,
    loadingProgressInfo = false,
    onSubmit,
    onCancel,
    submitting,
}: DeleteLessonDialogProps) {
    const hasProgress = progressInfo && progressInfo.totalProgressRecords > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        {hasProgress && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        Xóa Bài học
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 space-y-3">
                        <p>
                            Bạn có chắc chắn muốn xóa bài học{' '}
                            <strong className="text-white">"{deletingLesson?.title}"</strong>?
                        </p>

                        {loadingProgressInfo ? (
                            <div className="flex items-center gap-2 text-gray-500 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Đang kiểm tra dữ liệu học tập...</span>
                            </div>
                        ) : hasProgress ? (
                            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 space-y-3 mt-2">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2 text-sm">
                                        <p className="text-yellow-400 font-medium">
                                            ⚠️ Bài học này đã có dữ liệu học tập:
                                        </p>
                                        <ul className="space-y-1.5 text-gray-300 list-none">
                                            <li className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-400" />
                                                <span>
                                                    <strong>{progressInfo.uniqueUsersCount}</strong> học viên đã học bài này
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                <span>
                                                    <strong>{progressInfo.completedProgressRecords}</strong> bản ghi đã hoàn thành
                                                </span>
                                            </li>
                                            <li className="text-gray-400 text-xs mt-2 pt-2 border-t border-yellow-700/30">
                                                Khi xóa, tất cả dữ liệu progress sẽ bị xóa vĩnh viễn và tiến độ khóa học
                                                của các học viên sẽ được cập nhật lại.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                Bài học này chưa có dữ liệu học tập.
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DarkOutlineButton
                        onClick={onCancel}
                        disabled={submitting || loadingProgressInfo}
                    >
                        Hủy
                    </DarkOutlineButton>
                    <Button
                        onClick={onSubmit}
                        disabled={submitting || loadingProgressInfo}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xóa...
                            </>
                        ) : (
                            'Xóa'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

