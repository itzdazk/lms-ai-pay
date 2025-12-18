import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { LessonForm } from './LessonForm'
import type { Lesson, CreateLessonRequest, UpdateLessonRequest } from '../../lib/api/types'

interface LessonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingLesson: Lesson | null
    courseId: number
    chapterId: number | null
    onSubmit: (
        data: CreateLessonRequest | UpdateLessonRequest,
        videoFile?: File,
        transcriptFile?: File
    ) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export function LessonDialog({
    open,
    onOpenChange,
    editingLesson,
    courseId,
    chapterId,
    onSubmit,
    onCancel,
    loading,
}: LessonDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-[#1A1A1A] border-[#2D2D2D] max-h-[95vh] flex flex-col p-0 sm:max-w-5xl w-[98vw]"
            >
                <DialogHeader className="px-8 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle className="text-white">
                        {editingLesson ? 'Chỉnh sửa Bài học' : 'Tạo Bài học mới'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {editingLesson
                            ? 'Cập nhật thông tin bài học'
                            : 'Nhập thông tin để tạo bài học mới'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-8 custom-scrollbar">
                    {chapterId && (
                        <LessonForm
                            lesson={editingLesson}
                            courseId={courseId}
                            chapterId={chapterId}
                            onSubmit={onSubmit}
                            onCancel={onCancel}
                            loading={loading}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

