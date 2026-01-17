import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2, AlertTriangle, Users, BookOpen } from 'lucide-react'

interface ReorderLessonsWarningDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    progressInfo: {
        totalProgressRecords: number
        lessonsWithProgress: number[]
        uniqueUsersCount: number
    } | null
    loadingProgressInfo?: boolean
    onSubmit: () => Promise<void>
    onCancel: () => void
    submitting: boolean
}

export function ReorderLessonsWarningDialog({
    open,
    onOpenChange,
    progressInfo,
    loadingProgressInfo = false,
    onSubmit,
    onCancel,
    submitting,
}: ReorderLessonsWarningDialogProps) {
    const hasProgress = progressInfo && progressInfo.totalProgressRecords > 0
    const lessonsCount = progressInfo?.lessonsWithProgress.length || 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        {hasProgress && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        Cảnh báo khi sắp xếp lại bài học
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 space-y-3">
                        <p>
                            Bạn có chắc chắn muốn sắp xếp lại thứ tự các bài học?
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
                                    <div className="space-y-2 text-sm flex-1">
                                        <p className="text-yellow-400 font-medium">
                                            ⚠️ Các bài học này đã có dữ liệu học tập:
                                        </p>
                                        <ul className="space-y-1.5 text-gray-300 list-none">
                                            <li className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-blue-400" />
                                                <span>
                                                    <strong>{lessonsCount}</strong> bài học đã có học viên học
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-purple-400" />
                                                <span>
                                                    <strong>{progressInfo.uniqueUsersCount}</strong> học viên đã học các bài học này
                                                </span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-400" />
                                                <span>
                                                    <strong>{progressInfo.totalProgressRecords}</strong> bản ghi progress tổng cộng
                                                </span>
                                            </li>
                                        </ul>
                                        <div className="text-gray-400 text-xs mt-3 pt-3 border-t border-yellow-700/30 space-y-1.5">
                                            <p className="font-medium text-yellow-300">Lưu ý quan trọng:</p>
                                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                                                <li>Thay đổi thứ tự sẽ ảnh hưởng đến logic unlock bài học của học viên</li>
                                                <li>Học viên có thể truy cập các bài học theo thứ tự mới</li>
                                                <li>Dữ liệu progress sẽ không bị mất, chỉ thay đổi thứ tự hiển thị</li>
                                                <li>Tiến độ khóa học của học viên sẽ không thay đổi (dựa trên số bài đã hoàn thành)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mt-2">
                                <p className="text-green-400 text-sm">
                                    ✓ Các bài học này chưa có dữ liệu học tập. Việc sắp xếp lại sẽ không ảnh hưởng đến học viên.
                                </p>
                            </div>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            'Xác nhận sắp xếp lại'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
